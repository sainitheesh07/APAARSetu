import io
import csv
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.models.submission import DataSubmission, ValidationIssue, SubmissionStatus, IssueSeverity, IssueType, ResolutionStatus
from app.models.student import Student, Enrolment, AdmissionStatus, SeatCategory, RecordStatus
from app.models.programme import Programme
from app.models.user import User
from app.services.validation_engine import ValidationEngine
from app.services.audit_service import AuditService
from app.schemas.submission import PreviewResponse, RowValidationResult, ValidationSummary, CommitResponse
from app.core.security import hash_apaar_id, mask_apaar_id

# In-memory storage for active preview sessions
PREVIEW_CACHE: Dict[str, Dict[str, Any]] = {}

class SubmissionService:

    @classmethod
    def parse_and_preview(
        cls,
        db: Session,
        file_bytes: bytes,
        filename: str,
        institution_id: int,
        academic_year: str,
        user: User
    ) -> PreviewResponse:
        # Decode file with fallback encodings
        content = None
        for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                content = file_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if not content:
            raise ValueError("Could not decode file content. Please ensure file is valid UTF-8 CSV.")

        # Read into pandas DataFrame
        df = pd.read_csv(io.StringIO(content), dtype=str)
        # Normalize column headers
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Check required columns
        required_cols = ["student_name", "admission_id", "programme_code"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing mandatory CSV columns: {', '.join(missing_cols)}. Expected columns: student_name, admission_id, apaar_id, programme_code, seat_category, dob, admission_date")

        # Fill NaNs with empty string
        df = df.fillna("")
        raw_rows = df.to_dict(orient="records")

        # Run validation engine
        row_results, summary = ValidationEngine.validate_batch(
            db=db,
            institution_id=institution_id,
            academic_year=academic_year,
            rows=raw_rows
        )

        token = uuid.uuid4().hex
        PREVIEW_CACHE[token] = {
            "token": token,
            "filename": filename,
            "institution_id": institution_id,
            "academic_year": academic_year,
            "user_id": user.id,
            "raw_rows": raw_rows,
            "row_results": row_results,
            "summary": summary,
            "created_at": datetime.utcnow()
        }

        # Build preview response with first 100 rows
        preview_rows = raw_rows[:100]

        return PreviewResponse(
            submission_token=token,
            filename=filename,
            total_rows=len(raw_rows),
            headers=list(df.columns),
            preview_rows=preview_rows,
            row_results=row_results,
            summary=summary
        )

    @classmethod
    def generate_error_report_csv(cls, token: str) -> str:
        session = PREVIEW_CACHE.get(token)
        if not session:
            raise ValueError("Submission session expired or invalid token.")

        row_results: List[RowValidationResult] = session["row_results"]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Row Number",
            "Student Name",
            "Admission ID",
            "Masked APAAR ID",
            "Programme Code",
            "Seat Category",
            "Field",
            "Issue Type",
            "Severity",
            "Error Description",
            "Suggested Fix"
        ])

        for res in row_results:
            if not res.is_valid or res.issues:
                for issue in res.issues:
                    writer.writerow([
                        res.row_number,
                        res.student_name,
                        res.admission_id,
                        res.apaar_id_masked,
                        res.programme_code,
                        res.seat_category,
                        issue.field,
                        issue.issue_type.value,
                        issue.severity.value,
                        issue.message,
                        issue.suggested_fix or ""
                    ])

        return output.getvalue()

    @classmethod
    def commit_submission(
        cls,
        db: Session,
        token: str,
        user: User,
        commit_mode: str = "VALID_ONLY"
    ) -> CommitResponse:
        session = PREVIEW_CACHE.get(token)
        if not session:
            raise ValueError("Submission session expired or invalid token.")

        institution_id = session["institution_id"]
        academic_year = session["academic_year"]
        raw_rows = session["raw_rows"]
        row_results: List[RowValidationResult] = session["row_results"]

        # Fetch programmes for mapping
        programmes = db.query(Programme).filter(Programme.institution_id == institution_id).all()
        prog_by_code = {p.code.strip().upper(): p for p in programmes}

        # Create DataSubmission record
        submission = DataSubmission(
            institution_id=institution_id,
            submitted_by=user.id,
            academic_year=academic_year,
            filename=session["filename"],
            total_rows=len(raw_rows),
            status=SubmissionStatus.VALIDATING
        )
        db.add(submission)
        db.flush()

        accepted_count = 0
        rejected_count = 0
        pending_review_count = 0

        # Process each row
        for idx, (raw, res) in enumerate(zip(raw_rows, row_results), start=1):
            if res.is_valid:
                # Valid row -> Insert Student & Enrolment
                raw_apaar = str(raw.get("apaar_id", "")).strip()
                apaar_hash = hash_apaar_id(raw_apaar)
                masked_apaar = mask_apaar_id(raw_apaar)
                prog = prog_by_code.get(str(raw.get("programme_code", "")).strip().upper())
                
                # Seat category
                cat_str = str(raw.get("seat_category", "REGULAR")).strip().upper()
                try:
                    category = SeatCategory(cat_str)
                except Exception:
                    category = SeatCategory.REGULAR

                student = Student(
                    apaar_id_masked=masked_apaar,
                    apaar_hash=apaar_hash,
                    student_name=str(raw.get("student_name", "")).strip(),
                    dob=str(raw.get("dob", "")).strip() or None,
                    gender=str(raw.get("gender", "")).strip() or None,
                    institution_id=institution_id,
                    programme_id=prog.id if prog else programmes[0].id,
                    academic_year=academic_year,
                    admission_id=str(raw.get("admission_id", "")).strip(),
                    admission_date=str(raw.get("admission_date", "")).strip() or None,
                    admission_status=AdmissionStatus.ENROLLED,
                    seat_category=category,
                    record_status=RecordStatus.VERIFIED,
                    source_of_submission="CSV_BULK"
                )
                db.add(student)
                db.flush()

                enrolment = Enrolment(
                    student_id=student.id,
                    institution_id=institution_id,
                    programme_id=student.programme_id,
                    academic_year=academic_year,
                    admission_status=AdmissionStatus.ENROLLED,
                    seat_category=category,
                    submission_id=submission.id
                )
                db.add(enrolment)
                accepted_count += 1
            else:
                # Invalid row -> Record Validation Issues
                rejected_count += 1
                for issue in res.issues:
                    db_issue = ValidationIssue(
                        submission_id=submission.id,
                        row_number=issue.row_number,
                        issue_type=issue.issue_type,
                        severity=issue.severity,
                        description=issue.message,
                        raw_record_snippet=f"Admission ID: {res.admission_id}, APAAR: {res.apaar_id_masked}, Prog: {res.programme_code}",
                        resolution_status=ResolutionStatus.PENDING
                    )
                    db.add(db_issue)

        submission.accepted_rows = accepted_count
        submission.rejected_rows = rejected_count
        submission.pending_review_rows = rejected_count
        submission.status = SubmissionStatus.COMPLETED

        db.commit()
        db.refresh(submission)

        # Audit log the submission
        AuditService.log(
            db=db,
            action="CSV_SUBMISSION_COMMITTED",
            entity_type="SUBMISSION",
            actor_role=user.role.value,
            actor_id=user.id,
            actor_name=user.full_name,
            institution_id=institution_id,
            entity_id=str(submission.id),
            outcome="SUCCESS",
            metadata={
                "filename": session["filename"],
                "total_rows": len(raw_rows),
                "accepted_count": accepted_count,
                "rejected_count": rejected_count
            }
        )

        # Clean preview cache
        PREVIEW_CACHE.pop(token, None)

        return CommitResponse(
            submission_id=submission.id,
            status=submission.status.value,
            total_processed=len(raw_rows),
            accepted_count=accepted_count,
            rejected_count=rejected_count,
            message=f"Batch processed: {accepted_count} students successfully enrolled, {rejected_count} rows flagged with validation issues."
        )
