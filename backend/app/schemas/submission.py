from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.submission import SubmissionStatus, IssueSeverity, IssueType, ResolutionStatus

class RowIssueDetail(BaseModel):
    row_number: int
    field: str
    issue_type: IssueType
    severity: IssueSeverity
    message: str
    suggested_fix: Optional[str] = None

class RowValidationResult(BaseModel):
    row_number: int
    student_name: str
    admission_id: str
    apaar_id_masked: str
    programme_code: str
    seat_category: str
    academic_year: str
    is_valid: bool
    issues: List[RowIssueDetail] = []

class ValidationSummary(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_in_file_count: int
    duplicate_existing_count: int
    cross_institution_count: int
    intake_exceeded_count: int
    missing_apaar_count: int
    can_commit: bool

class PreviewResponse(BaseModel):
    submission_token: str
    filename: str
    total_rows: int
    headers: List[str]
    preview_rows: List[Dict[str, Any]]
    row_results: List[RowValidationResult]
    summary: ValidationSummary

class CommitRequest(BaseModel):
    submission_token: str
    commit_mode: str = "VALID_ONLY"  # "VALID_ONLY" or "ALL_IF_NO_CRITICAL"

class CommitResponse(BaseModel):
    submission_id: int
    status: str
    total_processed: int
    accepted_count: int
    rejected_count: int
    message: str

class ValidationIssueResponse(BaseModel):
    id: int
    submission_id: Optional[int] = None
    student_id: Optional[str] = None
    row_number: Optional[int] = None
    issue_type: IssueType
    severity: IssueSeverity
    description: str
    raw_record_snippet: Optional[str] = None
    resolution_status: ResolutionStatus
    reviewed_by: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None

    class Config:
        from_attributes = True

class IssueResolveRequest(BaseModel):
    resolution_status: ResolutionStatus
    resolution_notes: str

class SubmissionResponse(BaseModel):
    id: int
    institution_id: int
    institution_name: Optional[str] = None
    academic_year: str
    filename: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    pending_review_rows: int
    status: SubmissionStatus
    created_at: datetime
    submitter_name: Optional[str] = None

    class Config:
        from_attributes = True
