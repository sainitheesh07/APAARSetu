import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        entity_type: str,
        actor_role: str,
        actor_id: Optional[int] = None,
        actor_name: Optional[str] = None,
        institution_id: Optional[int] = None,
        entity_id: Optional[str] = None,
        outcome: str = "SUCCESS",
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Creates an immutable audit log entry.
        Never stores full APAAR IDs, plaintext passwords, or raw secrets.
        """
        safe_meta = {}
        if metadata:
            for k, v in metadata.items():
                if any(secret_term in k.lower() for secret_term in ["password", "token", "secret", "plain_apaar"]):
                    continue
                safe_meta[k] = v

        log_entry = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            institution_id=institution_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            outcome=outcome,
            metadata_json=json.dumps(safe_meta) if safe_meta else None,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
