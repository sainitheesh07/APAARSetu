from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.programme import QualificationLevel

class ProgrammeBase(BaseModel):
    institution_id: int
    name: str
    code: str
    qualification_level: QualificationLevel = QualificationLevel.UNDERGRADUATE
    approved_intake: int
    academic_year: str = "2026-2027"
    is_active: bool = True

class ProgrammeCreate(ProgrammeBase):
    pass

class ProgrammeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    qualification_level: Optional[QualificationLevel] = None
    approved_intake: Optional[int] = None
    academic_year: Optional[str] = None
    is_active: Optional[bool] = None

class ProgrammeResponse(ProgrammeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    institution_name: Optional[str] = None
    enrolled_count: Optional[int] = 0
    supernumerary_count: Optional[int] = 0
    remaining_intake: Optional[int] = 0
    intake_utilization_pct: Optional[float] = 0.0

    class Config:
        from_attributes = True

class IntakeSummary(BaseModel):
    programme_id: int
    programme_name: str
    programme_code: str
    approved_intake: int
    regular_enrolled: int
    supernumerary_enrolled: int
    total_enrolled: int
    remaining_seats: int
    excess_enrolment: int
    utilization_pct: float
    is_overrun: bool
