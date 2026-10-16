import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RFIDEvent(Base):
    __tablename__ = "rfid_events"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    device_id: Mapped[str] = mapped_column(String(64), nullable=False)
    epc: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    rfid_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("rfid_cards.rfid_id"), nullable=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True
    )
    bus_id: Mapped[str] = mapped_column(String(32), nullable=False)
    trip_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    journey_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("journeys.journey_id"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(16), nullable=False)
    stop_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("stops.stop_id"), nullable=True
    )
    stop_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    geog: Mapped[str | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True
    )
    speed_kmph: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    gps_utc_time: Mapped[str | None] = mapped_column(String(16), nullable=True)
    gps_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    session_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    session_ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )