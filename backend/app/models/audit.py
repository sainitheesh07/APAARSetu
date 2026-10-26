from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True, index=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=False, index=True)
    institution_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, LOGOUT, CSV_UPLOAD, STUDENT_CREATE, VERIFICATION_QUERY, ISSUE_RESOLVED, etc.
    entity_type = Column(String(100), nullable=False)        # USER, INSTITUTION, STUDENT, SUBMISSION, VERIFICATION
    entity_id = Column(String(100), nullable=True)
    outcome = Column(String(50), default="SUCCESS", nullable=False) # SUCCESS, FAILURE, DENIED
    metadata_json = Column(Text, nullable=True)              # JSON string of non-sensitive attributes
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
