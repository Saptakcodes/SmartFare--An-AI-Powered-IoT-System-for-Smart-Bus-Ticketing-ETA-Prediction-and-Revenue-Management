import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DigitalTicket(Base):
    __tablename__ = "digital_tickets"

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    route_id: Mapped[str] = mapped_column(String(32), ForeignKey("routes.route_id"), nullable=False)
    from_stop_id: Mapped[str] = mapped_column(String(32), ForeignKey("stops.stop_id"), nullable=False)
    to_stop_id: Mapped[str] = mapped_column(String(32), ForeignKey("stops.stop_id"), nullable=False)
    
    qr_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="ACTIVE") # ACTIVE, USED, EXPIRED
    amount_paid: Mapped[float] = mapped_column(nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)