from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.student import AdmissionStatus, SeatCategory, RecordStatus

class StudentCreate(BaseModel):
    apaar_id: str = Field(..., description="12-digit numeric APAAR ID or synthetic equivalent")
    student_name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    institution_id: int
    programme_id: int
    academic_year: str = "2026-2027"
    admission_id: str
    admission_date: Optional[str] = None
    admission_status: AdmissionStatus = AdmissionStatus.ENROLLED
    seat_category: SeatCategory = SeatCategory.REGULAR

class StudentUpdate(BaseModel):
    student_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    programme_id: Optional[int] = None
    admission_status: Optional[AdmissionStatus] = None
    seat_category: Optional[SeatCategory] = None
    record_status: Optional[RecordStatus] = None

class EnrolmentResponse(BaseModel):
    id: int
    institution_id: int
    institution_name: Optional[str] = None
    programme_id: int
    programme_name: Optional[str] = None
    academic_year: str
    admission_status: AdmissionStatus
    seat_category: SeatCategory
    created_at: datetime

    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    id: str
    apaar_id_masked: str
    student_name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    institution_id: int
    institution_name: Optional[str] = None
    programme_id: int
    programme_name: Optional[str] = None
    programme_code: Optional[str] = None
    academic_year: str
    admission_id: str
    admission_date: Optional[str] = None
    admission_status: AdmissionStatus
    seat_category: SeatCategory
    record_status: RecordStatus
    source_of_submission: str
    created_at: datetime
    updated_at: datetime
    enrolments: Optional[List[EnrolmentResponse]] = []

    class Config:
        from_attributes = True
