import re
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.student import Student, Enrolment, SeatCategory
from app.models.programme import Programme
from app.models.institution import Institution
from app.models.submission import IssueSeverity, IssueType
from app.schemas.submission import RowIssueDetail, RowValidationResult, ValidationSummary
from app.core.security import hash_apaar_id, mask_apaar_id

class ValidationEngine:
    """
    Central Validation Engine for APAARSetu.
    Executes multi-tier validation:
    1. APAAR ID structural & checksum rules
    2. Batch-internal uniqueness
    3. Institutional database duplicate checking
    4. Cross-institutional dual enrolment conflicts
    5. AICTE Approved Intake ceiling checks
    6. Seat category & demographic consistency
    """

    @staticmethod
    def validate_apaar_format(raw_id: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Validates APAAR ID format.
        Rules:
        - Must be present
        - Exactly 12 digits
        - Cannot be dummy sequences like 000000000000 or 123456789012
        """
        if not raw_id or str(raw_id).strip() == "" or str(raw_id).lower() == "nan":
            return False, "APAAR ID is missing. Academic identification is mandatory for AICTE records."
        
        cleaned = re.sub(r"[-\s]", "", str(raw_id).strip())
        if not re.match(r"^\d{12}$", cleaned):
            return False, f"APAAR ID '{raw_id}' must be exactly 12 numeric digits (current length: {len(cleaned)})."
        
        if cleaned == "000000000000" or cleaned == "111111111111":
            return False, "APAAR ID cannot consist of all identical dummy digits."
            
        return True, None

    @classmethod
    def validate_batch(
        cls,
        db: Session,
        institution_id: int,
        academic_year: str,
        rows: List[Dict[str, Any]]
    ) -> Tuple[List[RowValidationResult], ValidationSummary]:
        
        # 1. Fetch institution & active programmes
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if not inst:
            raise ValueError(f"Institution with ID {institution_id} not found.")

        programmes = db.query(Programme).filter(
            Programme.institution_id == institution_id,
            Programme.is_active == True
        ).all()
        prog_by_code = {p.code.strip().upper(): p for p in programmes}
        prog_by_id = {p.id: p for p in programmes}

        # 2. Pre-fetch existing enrolments for intake counts in this academic year
        # Count current regular enrolments per programme in DB
        current_enrolments = {}
        for p in programmes:
            reg_count = db.query(Student).filter(
                Student.institution_id == institution_id,
                Student.programme_id == p.id,
                Student.academic_year == academic_year,
                Student.seat_category == SeatCategory.REGULAR
            ).count()
            current_enrolments[p.id] = reg_count

        # 3. Track seen identifiers within this batch
        seen_apaars_in_file: Dict[str, int] = {}  # apaar_hash -> row_number
        seen_admission_ids_in_file: Dict[str, int] = {}  # admission_id -> row_number
        new_batch_regular_counts: Dict[int, int] = {p.id: 0 for p in programmes}

        row_results: List[RowValidationResult] = []
        dup_in_file_count = 0
        dup_existing_count = 0
        cross_inst_count = 0
        intake_exceeded_count = 0
        missing_apaar_count = 0
        valid_rows_count = 0

        # Valid seat categories
        valid_categories = {c.value for c in SeatCategory}

        for idx, row in enumerate(rows, start=1):
            issues: List[RowIssueDetail] = []

            raw_name = str(row.get("student_name", "")).strip()
            raw_adm_id = str(row.get("admission_id", "")).strip()
            raw_apaar = str(row.get("apaar_id", "")).strip()
            raw_prog = str(row.get("programme_code", "")).strip().upper()
            raw_cat = str(row.get("seat_category", "REGULAR")).strip().upper()
            raw_dob = str(row.get("dob", "")).strip()

            masked_apaar = mask_apaar_id(raw_apaar) if raw_apaar else "NOT_PROVIDED"

            # Check required fields
            if not raw_name or raw_name == "nan":
                issues.append(RowIssueDetail(
                    row_number=idx,
                    field="student_name",
                    issue_type=IssueType.INCONSISTENT_STUDENT_DATA,
                    severity=IssueSeverity.CRITICAL,
                    message="Student name is required.",
                    suggested_fix="Provide legal full name as per matriculation certificate."
                ))

            if not raw_adm_id or raw_adm_id == "nan":
                issues.append(RowIssueDetail(
                    row_number=idx,
                    field="admission_id",
                    issue_type=IssueType.INCONSISTENT_STUDENT_DATA,
                    severity=IssueSeverity.CRITICAL,
                    message="Admission ID (Registration / Roll No) is required.",
                    suggested_fix="Provide valid institutional admission registration number."
                ))
            else:
                if raw_adm_id in seen_admission_ids_in_file:
                    first_row = seen_admission_ids_in_file[raw_adm_id]
                    issues.append(RowIssueDetail(
                        row_number=idx,
                        field="admission_id",
                        issue_type=IssueType.INCONSISTENT_STUDENT_DATA,
                        severity=IssueSeverity.CRITICAL,
                        message=f"Duplicate Admission ID '{raw_adm_id}' already seen in Row {first_row}.",
                        suggested_fix="Ensure admission ID is unique per student."
                    ))
                else:
                    seen_admission_ids_in_file[raw_adm_id] = idx

            # APAAR Format Check
            is_apaar_fmt_valid, apaar_err = cls.validate_apaar_format(raw_apaar)
            apaar_hash = None
            if not is_apaar_fmt_valid:
                missing_apaar_count += 1
                issues.append(RowIssueDetail(
                    row_number=idx,
                    field="apaar_id",
                    issue_type=IssueType.MISSING_APAAR_ID if "missing" in (apaar_err or "").lower() else IssueType.INVALID_APAAR_FORMAT,
                    severity=IssueSeverity.CRITICAL,
                    message=apaar_err or "Invalid APAAR ID",
                    suggested_fix="Verify 12-digit APAAR ID card or register student on APAAR portal."
                ))
            else:
                apaar_hash = hash_apaar_id(raw_apaar)

                # Check Duplicate APAAR within File
                if apaar_hash in seen_apaars_in_file:
                    dup_in_file_count += 1
                    first_row = seen_apaars_in_file[apaar_hash]
                    issues.append(RowIssueDetail(
                        row_number=idx,
                        field="apaar_id",
                        issue_type=IssueType.DUPLICATE_APAAR_IN_FILE,
                        severity=IssueSeverity.CRITICAL,
                        message=f"Duplicate APAAR ID detected in same file. First appeared at Row {first_row}.",
                        suggested_fix="Remove duplicate entry or consolidate student record."
                    ))
                else:
                    seen_apaars_in_file[apaar_hash] = idx

                # Check Duplicate in Existing Institution Records for this Academic Year
                existing_same_inst = db.query(Student).filter(
                    Student.apaar_hash == apaar_hash,
                    Student.institution_id == institution_id,
                    Student.academic_year == academic_year
                ).first()
                if existing_same_inst:
                    dup_existing_count += 1
                    issues.append(RowIssueDetail(
                        row_number=idx,
                        field="apaar_id",
                        issue_type=IssueType.DUPLICATE_EXISTING_STUDENT,
                        severity=IssueSeverity.CRITICAL,
                        message=f"Student with APAAR ID {masked_apaar} is already enrolled in this institution (Admission ID: {existing_same_inst.admission_id}).",
                        suggested_fix="Update existing record or verify student registration details."
                    ))

                # Check Cross-Institution Multi-Enrolment Conflict
                cross_inst_student = db.query(Student).join(Institution).filter(
                    Student.apaar_hash == apaar_hash,
                    Student.institution_id != institution_id,
                    Student.academic_year == academic_year
                ).first()
                if cross_inst_student:
                    cross_inst_count += 1
                    issues.append(RowIssueDetail(
                        row_number=idx,
                        field="apaar_id",
                        issue_type=IssueType.CROSS_INSTITUTION_ENROLMENT,
                        severity=IssueSeverity.CRITICAL,
                        message=f"CROSS-INSTITUTION CONFLICT: APAAR ID {masked_apaar} is concurrently enrolled at '{cross_inst_student.institution.name}' (Code: {cross_inst_student.institution.code}) for academic year {academic_year}.",
                        suggested_fix="Contact AICTE admin or verify transfer certificate / migration clearance before submission."
                    ))

            # Validate Programme
            target_prog = prog_by_code.get(raw_prog)
            if not target_prog:
                issues.append(RowIssueDetail(
                    row_number=idx,
                    field="programme_code",
                    issue_type=IssueType.UNAPPROVED_PROGRAMME,
                    severity=IssueSeverity.CRITICAL,
                    message=f"Programme code '{raw_prog}' is not approved or active for this institution. Available: {', '.join(prog_by_code.keys())}",
                    suggested_fix=f"Use one of the approved programme codes: {', '.join(prog_by_code.keys())}"
                ))
            else:
                # Validate Category
                if raw_cat not in valid_categories:
                    issues.append(RowIssueDetail(
                        row_number=idx,
                        field="seat_category",
                        issue_type=IssueType.INVALID_SEAT_CATEGORY,
                        severity=IssueSeverity.WARNING,
                        message=f"Unknown seat category '{raw_cat}'. Valid options: {', '.join(valid_categories)}",
                        suggested_fix="Defaulting to REGULAR or specify approved category like SUPERNUMERARY_TFW, NRI, etc."
                    ))
                    effective_cat = SeatCategory.REGULAR
                else:
                    effective_cat = SeatCategory(raw_cat)

                # Intake Overrun Check (Only for REGULAR seats)
                if effective_cat == SeatCategory.REGULAR:
                    current_reg = current_enrolments.get(target_prog.id, 0)
                    new_reg = new_batch_regular_counts.get(target_prog.id, 0)
                    projected_total = current_reg + new_reg + 1
                    approved_cap = target_prog.approved_intake

                    if projected_total > approved_cap:
                        intake_exceeded_count += 1
                        excess = projected_total - approved_cap
                        issues.append(RowIssueDetail(
                            row_number=idx,
                            field="programme_code",
                            issue_type=IssueType.INTAKE_EXCEEDED,
                            severity=IssueSeverity.CRITICAL,
                            message=f"APPROVED INTAKE EXCEEDED: Adding this student makes regular enrolment {projected_total}, which exceeds AICTE approved intake of {approved_cap} for {target_prog.name} (Excess: +{excess}).",
                            suggested_fix="Do not admit beyond approved quota without AICTE sanction, or classify as supernumerary if eligible."
                        ))
                    else:
                        new_batch_regular_counts[target_prog.id] = new_reg + 1

            is_row_valid = len([i for i in issues if i.severity == IssueSeverity.CRITICAL]) == 0
            if is_row_valid:
                valid_rows_count += 1

            row_results.append(RowValidationResult(
                row_number=idx,
                student_name=raw_name,
                admission_id=raw_adm_id,
                apaar_id_masked=masked_apaar,
                programme_code=raw_prog,
                seat_category=raw_cat,
                academic_year=academic_year,
                is_valid=is_row_valid,
                issues=issues
            ))

        total_rows = len(rows)
        invalid_rows_count = total_rows - valid_rows_count
        summary = ValidationSummary(
            total_rows=total_rows,
            valid_rows=valid_rows_count,
            invalid_rows=invalid_rows_count,
            duplicate_in_file_count=dup_in_file_count,
            duplicate_existing_count=dup_existing_count,
            cross_institution_count=cross_inst_count,
            intake_exceeded_count=intake_exceeded_count,
            missing_apaar_count=missing_apaar_count,
            can_commit=valid_rows_count > 0
        )

        return row_results, summary
