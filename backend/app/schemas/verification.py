from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.verification import VerificationPurpose, VerificationResult

class VerificationCreateRequest(BaseModel):
    identifier: str  # Can be 12-digit APAAR ID or Student Admission ID
    institution_code: Optional[str] = None
    purpose: VerificationPurpose = VerificationPurpose.EMPLOYMENT
    requester_name: str
    requester_org: Optional[str] = None
    consent_reference: Optional[str] = None

class VerificationResponse(BaseModel):
    reference_no: str
    verification_result: VerificationResult
    is_verified: bool
    student_name_masked: Optional[str] = None
    apaar_id_masked: Optional[str] = None
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    programme_name: Optional[str] = None
    qualification_level: Optional[str] = None
    academic_year: Optional[str] = None
    admission_status: Optional[str] = None
    seat_category: Optional[str] = None
    verified_at: datetime
    purpose: str
    verification_notes: Optional[str] = None
    digital_seal_hash: Optional[str] = None

    class Config:
        from_attributes = True

class StudentCorrectionCreate(BaseModel):
    student_id: str
    field_to_correct: str
    proposed_value: str
    reason: str
    supporting_doc_ref: Optional[str] = None

class StudentCorrectionResponse(BaseModel):
    id: int
    student_id: str
    student_name: Optional[str] = None
    field_to_correct: str
    current_value: Optional[str] = None
    proposed_value: str
    reason: str
    supporting_doc_ref: Optional[str] = None
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewer_notes: Optional[str] = None

    class Config:
        from_attributes = True
