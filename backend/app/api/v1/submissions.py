from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.submission import DataSubmission, ValidationIssue
from app.models.user import User, UserRole
from app.schemas.submission import (
    PreviewResponse, CommitRequest, CommitResponse, SubmissionResponse, ValidationIssueResponse
)
from app.api.v1.deps import require_current_user, verify_institution_access
from app.services.submission_service import SubmissionService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/preview", response_model=PreviewResponse)
async def preview_csv(
    file: UploadFile = File(...),
    academic_year: str = Form("2026-2027"),
    institution_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    # Determine effective institution
    target_inst_id = user.institution_id if user.role == UserRole.INSTITUTION_ADMIN else institution_id
    if not target_inst_id:
        raise HTTPException(status_code=400, detail="institution_id is required.")

    verify_institution_access(target_inst_id, user)

    # Validate file extension
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported for bulk upload.")

    # Max file size limit: 5MB for hackathon safety
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit of 5MB.")

    try:
        preview = SubmissionService.parse_and_preview(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename,
            institution_id=target_inst_id,
            academic_year=academic_year,
            user=user
        )
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/commit", response_model=CommitResponse)
def commit_submission(
    req: CommitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    try:
        res = SubmissionService.commit_submission(
            db=db,
            token=req.submission_token,
            user=user,
            commit_mode=req.commit_mode
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/error-report/{token}", response_class=PlainTextResponse)
def get_error_report(token: str):
    try:
        csv_content = SubmissionService.generate_error_report_csv(token)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=validation_error_report_{token[:8]}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/template/sample-csv", response_class=PlainTextResponse)
def get_sample_csv_template():
    sample_content = (
        "student_name,admission_id,apaar_id,programme_code,seat_category,dob,admission_date\n"
        "Aarav Sharma,IITD-2026-CSE-001,849302194821,CSE,REGULAR,2005-04-12,2026-08-01\n"
        "Priya Patel,IITD-2026-CSE-002,948201948201,CSE,REGULAR,2005-07-23,2026-08-01\n"
        "Rohan Gupta,IITD-2026-ECE-001,739102847192,ECE,REGULAR,2004-11-05,2026-08-02\n"
        "Ananya Rao,IITD-2026-CSE-003,583920194821,CSE,SUPERNUMERARY_TFW,2005-02-18,2026-08-02\n"
        "Vikram Singh,IITD-2026-ME-001,392810482910,ME,REGULAR,2005-09-14,2026-08-03\n"
    )
    return Response(
        content=sample_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apaarsetu_student_upload_template.csv"}
    )

@router.get("", response_model=List[SubmissionResponse])
def get_submissions(
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(DataSubmission)

    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(DataSubmission.institution_id == user.institution_id)
    elif institution_id:
        query = query.filter(DataSubmission.institution_id == institution_id)

    submissions = query.order_by(DataSubmission.created_at.desc()).all()
    results = []

    for s in submissions:
        resp = SubmissionResponse(
            id=s.id,
            institution_id=s.institution_id,
            institution_name=s.institution.name if s.institution else "N/A",
            academic_year=s.academic_year,
            filename=s.filename,
            total_rows=s.total_rows,
            accepted_rows=s.accepted_rows,
            rejected_rows=s.rejected_rows,
            pending_review_rows=s.pending_review_rows,
            status=s.status,
            created_at=s.created_at,
            submitter_name=s.submitter.full_name if s.submitter else "System"
        )
        results.append(resp)

    return results

@router.get("/{id}", response_model=SubmissionResponse)
def get_submission(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    sub = db.query(DataSubmission).filter(DataSubmission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    verify_institution_access(sub.institution_id, user)

    return SubmissionResponse(
        id=sub.id,
        institution_id=sub.institution_id,
        institution_name=sub.institution.name if sub.institution else "N/A",
        academic_year=sub.academic_year,
        filename=sub.filename,
        total_rows=sub.total_rows,
        accepted_rows=sub.accepted_rows,
        rejected_rows=sub.rejected_rows,
        pending_review_rows=sub.pending_review_rows,
        status=sub.status,
        created_at=sub.created_at,
        submitter_name=sub.submitter.full_name if sub.submitter else "System"
    )

@router.get("/{id}/issues", response_model=List[ValidationIssueResponse])
def get_submission_issues(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    sub = db.query(DataSubmission).filter(DataSubmission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    verify_institution_access(sub.institution_id, user)

    issues = db.query(ValidationIssue).filter(ValidationIssue.submission_id == id).all()
    results = []

    for issue in issues:
        resp = ValidationIssueResponse(
            id=issue.id,
            submission_id=issue.submission_id,
            student_id=issue.student_id,
            row_number=issue.row_number,
            issue_type=issue.issue_type,
            severity=issue.severity,
            description=issue.description,
            raw_record_snippet=issue.raw_record_snippet,
            resolution_status=issue.resolution_status,
            reviewed_by=issue.reviewed_by,
            reviewed_by_name=issue.reviewer.full_name if issue.reviewer else None,
            reviewed_at=issue.reviewed_at,
            resolution_notes=issue.resolution_notes,
            created_at=issue.created_at,
            institution_id=sub.institution_id,
            institution_name=sub.institution.name if sub.institution else "N/A"
        )
        results.append(resp)

    return results
