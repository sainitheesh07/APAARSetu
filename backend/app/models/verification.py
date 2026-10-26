import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class VerificationPurpose(str, enum.Enum):
    EMPLOYMENT = "EMPLOYMENT"
    HIGHER_EDUCATION = "HIGHER_EDUCATION"
    BACKGROUND_CHECK = "BACKGROUND_CHECK"
    SCHOLARSHIP = "SCHOLARSHIP"
    GOVERNMENT_BENEFIT = "GOVERNMENT_BENEFIT"
    OTHER = "OTHER"

class VerificationResult(str, enum.Enum):
    VERIFIED = "VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"
    PENDING_REVIEW = "PENDING_REVIEW"
    INSUFFICIENT_CONSENT = "INSUFFICIENT_CONSENT"
    RECORD_NOT_FOUND = "RECORD_NOT_FOUND"

class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(50), unique=True, index=True, nullable=False, default=lambda: f"EDU-VRF-{datetime.utcnow().year}-{uuid.uuid4().hex[:8].upper()}")
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requester_name = Column(String(255), nullable=False)
    requester_org = Column(String(255), nullable=True)
    purpose = Column(SQLEnum(VerificationPurpose), default=VerificationPurpose.EMPLOYMENT, nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    identifier_queried = Column(String(100), nullable=False)  # Masked or Admission ID queried
    verification_result = Column(SQLEnum(VerificationResult), nullable=False)
    consent_reference = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="verifications")
    requester = relationship("User", foreign_keys=[requester_id])

class StudentCorrectionRequest(Base):
    __tablename__ = "student_correction_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    field_to_correct = Column(String(100), nullable=False)
    current_value = Column(String(255), nullable=True)
    proposed_value = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    supporting_doc_ref = Column(String(255), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
