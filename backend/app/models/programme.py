from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class QualificationLevel(str, enum.Enum):
    UNDERGRADUATE = "Undergraduate (B.Tech/B.E.)"
    POSTGRADUATE = "Postgraduate (M.Tech/M.E./MCA/MBA)"
    DIPLOMA = "Diploma in Engineering"
    DOCTORAL = "Doctoral (Ph.D.)"

class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)  # e.g., CSE, ECE, ME
    qualification_level = Column(SQLEnum(QualificationLevel), default=QualificationLevel.UNDERGRADUATE, nullable=False)
    approved_intake = Column(Integer, nullable=False)  # AICTE Approved Intake Capacity
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution", back_populates="programmes")
    students = relationship("Student", back_populates="programme")
    enrolments = relationship("Enrolment", back_populates="programme")
