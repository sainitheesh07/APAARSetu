import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogResponse
from app.api.v1.deps import require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    outcome: Optional[str] = None,
    actor_role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AUDITOR, UserRole.INSTITUTION_ADMIN]))
):
    query = db.query(AuditLog)

    if user.role == UserRole.INSTITUTION_ADMIN:
        query = query.filter(AuditLog.institution_id == user.institution_id)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if outcome:
        query = query.filter(AuditLog.outcome == outcome)
    if actor_role:
        query = query.filter(AuditLog.actor_role == actor_role)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/export-csv")
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AUDITOR]))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(1000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Log ID",
        "Timestamp (UTC)",
        "Actor ID",
        "Actor Name",
        "Actor Role",
        "Institution ID",
        "Action Type",
        "Entity Type",
        "Entity ID",
        "Outcome",
        "IP Address",
        "Safe Metadata"
    ])

    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat(),
            log.actor_id or "N/A",
            log.actor_name or "System",
            log.actor_role,
            log.institution_id or "N/A",
            log.action,
            log.entity_type,
            log.entity_id or "N/A",
            log.outcome,
            log.ip_address or "N/A",
            log.metadata_json or ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apaarsetu_audit_trail_export.csv"}
    )
