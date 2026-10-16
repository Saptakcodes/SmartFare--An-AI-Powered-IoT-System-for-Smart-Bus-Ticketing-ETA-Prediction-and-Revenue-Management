import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Journey(Base):
    __tablename__ = "journeys"

    journey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    rfid_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("rfid_cards.rfid_id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    bus_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("buses.bus_id"), nullable=False
    )
    trip_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("trips.trip_id"), nullable=False, index=True
    )
    route_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("routes.route_id"), nullable=False
    )
    boarding_stop_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("stops.stop_id"), nullable=True
    )
    latest_exit_stop_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("stops.stop_id"), nullable=True
    )
    boarding_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    latest_exit_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_fare: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, server_default="0"
    )
    amount_collected: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, server_default="0"
    )
    outstanding_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, server_default="0"
    )
    financial_state: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="PENDING"
    )
    journey_state: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="ACTIVE"
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )