from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.institution import InstitutionType, AICTEApprovalStatus

class InstitutionBase(BaseModel):
    code: str
    name: str
    institution_type: InstitutionType
    aicte_approval_status: AICTEApprovalStatus = AICTEApprovalStatus.APPROVED
    approval_ref: Optional[str] = None
    state: str
    district: str
    address: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    academic_year: str = "2026-2027"

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    institution_type: Optional[InstitutionType] = None
    aicte_approval_status: Optional[AICTEApprovalStatus] = None
    approval_ref: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    registration_status: Optional[str] = None

class InstitutionResponse(InstitutionBase):
    id: int
    registration_status: str
    created_at: datetime
    updated_at: datetime
    total_programmes: Optional[int] = 0
    total_approved_intake: Optional[int] = 0
    total_enrolled: Optional[int] = 0

    class Config:
        from_attributes = True
