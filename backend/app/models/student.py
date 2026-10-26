import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class AdmissionStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    TRANSFERRED = "TRANSFERRED"
    WITHDRAWN = "WITHDRAWN"
    GRADUATED = "GRADUATED"

class SeatCategory(str, enum.Enum):
    REGULAR = "REGULAR"
    SUPERNUMERARY_TFW = "SUPERNUMERARY_TFW"      # Tuition Fee Waiver
    SUPERNUMERARY_EWS = "SUPERNUMERARY_EWS"      # Economically Weaker Section
    SUPERNUMERARY_PMSSS = "SUPERNUMERARY_PMSSS"  # Prime Minister's Special Scholarship Scheme
    SUPERNUMERARY_JK = "SUPERNUMERARY_JK"        # Jammu & Kashmir / Ladakh quota
    NRI = "NRI"                                  # Non-Resident Indian
    OCI = "OCI"                                  # Overseas Citizen of India
    FOREIGN_NATIONAL = "FOREIGN_NATIONAL"        # Foreign Nationals / PIO

class RecordStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING_REVIEW = "PENDING_REVIEW"
    FLAGGED = "FLAGGED"

class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    apaar_id_masked = Column(String(50), nullable=False)
    apaar_hash = Column(String(64), index=True, nullable=False)  # Privacy-preserving HMAC-SHA256 fingerprint
    student_name = Column(String(255), nullable=False)
    dob = Column(String(20), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False, index=True)
    admission_id = Column(String(100), nullable=False, index=True)  # Institution Student Reg No
    admission_date = Column(String(20), nullable=True)
    admission_status = Column(SQLEnum(AdmissionStatus), default=AdmissionStatus.ENROLLED, nullable=False)
    seat_category = Column(SQLEnum(SeatCategory), default=SeatCategory.REGULAR, nullable=False)
    record_status = Column(SQLEnum(RecordStatus), default=RecordStatus.VERIFIED, nullable=False)
    source_of_submission = Column(String(50), default="MANUAL", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution", back_populates="students")
    programme = relationship("Programme", back_populates="students")
    enrolments = relationship("Enrolment", back_populates="student", cascade="all, delete-orphan")
    validation_issues = relationship("ValidationIssue", back_populates="student")
    verifications = relationship("VerificationRequest", back_populates="student")

class Enrolment(Base):
    __tablename__ = "enrolments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False, index=True)
    admission_status = Column(SQLEnum(AdmissionStatus), default=AdmissionStatus.ENROLLED, nullable=False)
    seat_category = Column(SQLEnum(SeatCategory), default=SeatCategory.REGULAR, nullable=False)
    submission_id = Column(Integer, ForeignKey("data_submissions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="enrolments")
    institution = relationship("Institution", back_populates="enrolments")
    programme = relationship("Programme", back_populates="enrolments")
