import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class SubmissionStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class IssueSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"

class IssueType(str, enum.Enum):
    DUPLICATE_APAAR_IN_FILE = "DUPLICATE_APAAR_IN_FILE"
    DUPLICATE_EXISTING_STUDENT = "DUPLICATE_EXISTING_STUDENT"
    CROSS_INSTITUTION_ENROLMENT = "CROSS_INSTITUTION_ENROLMENT"
    MISSING_APAAR_ID = "MISSING_APAAR_ID"
    INVALID_APAAR_FORMAT = "INVALID_APAAR_FORMAT"
    INTAKE_EXCEEDED = "INTAKE_EXCEEDED"
    UNAPPROVED_PROGRAMME = "UNAPPROVED_PROGRAMME"
    INCONSISTENT_STUDENT_DATA = "INCONSISTENT_STUDENT_DATA"
    INVALID_SEAT_CATEGORY = "INVALID_SEAT_CATEGORY"

class ResolutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    EXCEPTION_APPROVED = "EXCEPTION_APPROVED"
    REJECTED = "REJECTED"

class DataSubmission(Base):
    __tablename__ = "data_submissions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    accepted_rows = Column(Integer, default=0, nullable=False)
    rejected_rows = Column(Integer, default=0, nullable=False)
    pending_review_rows = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.UPLOADED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution", back_populates="submissions")
    submitter = relationship("User", foreign_keys=[submitted_by])
    programme = relationship("Programme")
    issues = relationship("ValidationIssue", back_populates="submission", cascade="all, delete-orphan")

class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=True, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    row_number = Column(Integer, nullable=True)
    issue_type = Column(SQLEnum(IssueType), nullable=False)
    severity = Column(SQLEnum(IssueSeverity), default=IssueSeverity.WARNING, nullable=False)
    description = Column(Text, nullable=False)
    raw_record_snippet = Column(Text, nullable=True)  # JSON or string representation of problem fields
    resolution_status = Column(SQLEnum(ResolutionStatus), default=ResolutionStatus.PENDING, nullable=False, index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    submission = relationship("DataSubmission", back_populates="issues")
    student = relationship("Student", back_populates="validation_issues")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
