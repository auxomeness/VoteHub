from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.utils.enums import AuditAction


def write_audit_log(
    db: Session,
    action: AuditAction,
    user_id: int | None = None,
    event_id: int | None = None,
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        event_id=event_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        ip_address=ip_address,
        user_agent=user_agent,
        log_metadata=metadata,
    )
    db.add(log)
    return log
