from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class InstitutionType(str, enum.Enum):
    CENTRAL_GOVERNMENT = "Central University/IIT/NIT"
    STATE_GOVERNMENT = "State University/Govt College"
    DEEMED_UNIVERSITY = "Deemed University"
    PRIVATE = "Private / Self-Financed"
    AUTONOMOUS = "Autonomous Institute"

class AICTEApprovalStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    PENDING_INSPECTION = "PENDING_INSPECTION"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # AICTE Institute Permanent ID
    name = Column(String(255), nullable=False)
    institution_type = Column(SQLEnum(InstitutionType), default=InstitutionType.AUTONOMOUS, nullable=False)
    aicte_approval_status = Column(SQLEnum(AICTEApprovalStatus), default=AICTEApprovalStatus.APPROVED, nullable=False)
    approval_ref = Column(String(100), nullable=True)  # e.g., AICTE/EOA/2026-27/1-987654
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    address = Column(String(500), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    registration_status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="institution", cascade="all, delete-orphan")
    programmes = relationship("Programme", back_populates="institution", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="institution")
    enrolments = relationship("Enrolment", back_populates="institution")
    submissions = relationship("DataSubmission", back_populates="institution")
