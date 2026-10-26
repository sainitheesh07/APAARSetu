from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_role: str
    institution_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    outcome: str
    metadata_json: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogFilter(BaseModel):
    role: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    outcome: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
