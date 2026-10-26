from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.submission import ValidationIssue, DataSubmission, IssueSeverity, IssueType, ResolutionStatus
from app.models.user import User, UserRole
from app.schemas.submission import ValidationIssueResponse, IssueResolveRequest
from app.api.v1.deps import require_current_user, require_role
from app.services.audit_service import AuditService

router = APIRouter(prefix="/validation", tags=["Validation & Review Center"])

@router.get("/issues", response_model=List[ValidationIssueResponse])
def get_validation_issues(
    severity: Optional[IssueSeverity] = None,
    issue_type: Optional[IssueType] = None,
    resolution_status: Optional[ResolutionStatus] = None,
    institution_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    query = db.query(ValidationIssue).outerjoin(DataSubmission)

    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(DataSubmission.institution_id == user.institution_id)
    elif institution_id:
        query = query.filter(DataSubmission.institution_id == institution_id)

    if severity:
        query = query.filter(ValidationIssue.severity == severity)
    if issue_type:
        query = query.filter(ValidationIssue.issue_type == issue_type)
    if resolution_status:
        query = query.filter(ValidationIssue.resolution_status == resolution_status)

    issues = query.order_by(ValidationIssue.created_at.desc()).offset(skip).limit(limit).all()
    results = []

    for issue in issues:
        sub = issue.submission
        inst = sub.institution if sub else None
        results.append(ValidationIssueResponse(
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
            institution_id=inst.id if inst else None,
            institution_name=inst.name if inst else "N/A"
        ))

    return results

@router.get("/issues/{id}", response_model=ValidationIssueResponse)
def get_validation_issue(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_current_user)
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Validation issue not found.")

    sub = issue.submission
    inst = sub.institution if sub else None

    if user.role == UserRole.INSTITUTION_ADMIN and inst and inst.id != user.institution_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to issue.")

    return ValidationIssueResponse(
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
        institution_id=inst.id if inst else None,
        institution_name=inst.name if inst else "N/A"
    )

@router.post("/issues/{id}/resolve", response_model=ValidationIssueResponse)
def resolve_validation_issue(
    id: int,
    req: IssueResolveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN]))
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Validation issue not found.")

    sub = issue.submission
    inst_id = sub.institution_id if sub else None

    # Institution admin can resolve their own non-critical issues or submit explanation, but cannot approve an intake overrun exception
    if req.resolution_status == ResolutionStatus.EXCEPTION_APPROVED and user.role != UserRole.AICTE_ADMIN:
        raise HTTPException(status_code=403, detail="Only AICTE Administrators are authorized to grant regulatory intake or duplicate exceptions.")

    if not req.resolution_notes or len(req.resolution_notes.strip()) < 5:
        raise HTTPException(status_code=400, detail="A detailed regulatory resolution explanation is required.")

    issue.resolution_status = req.resolution_status
    issue.resolution_notes = req.resolution_notes.strip()
    issue.reviewed_by = user.id
    issue.reviewed_at = datetime.utcnow()

    # Decrement pending review rows in submission if available
    if sub and sub.pending_review_rows > 0:
        sub.pending_review_rows -= 1

    db.commit()
    db.refresh(issue)

    AuditService.log(
        db=db,
        action="VALIDATION_ISSUE_RESOLVED",
        entity_type="VALIDATION_ISSUE",
        actor_role=user.role.value,
        actor_id=user.id,
        actor_name=user.full_name,
        institution_id=inst_id,
        entity_id=str(issue.id),
        outcome="SUCCESS",
        metadata={
            "issue_type": issue.issue_type.value,
            "resolution_status": req.resolution_status.value,
            "notes": req.resolution_notes
        }
    )

    inst = sub.institution if sub else None

    return ValidationIssueResponse(
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
        reviewed_by_name=user.full_name,
        reviewed_at=issue.reviewed_at,
        resolution_notes=issue.resolution_notes,
        created_at=issue.created_at,
        institution_id=inst.id if inst else None,
        institution_name=inst.name if inst else "N/A"
    )
