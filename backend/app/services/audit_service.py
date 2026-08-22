from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def log(
        self,
        *,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        user: User | None = None,
        ip_address: str | None = None,
    ) -> None:
        entry = AuditLog(
            user_id=user.id if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
        )
        self.db.add(entry)
        self.db.commit()
