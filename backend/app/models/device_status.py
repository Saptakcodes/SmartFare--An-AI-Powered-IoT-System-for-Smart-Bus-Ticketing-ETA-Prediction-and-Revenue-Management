from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DeviceStatus(Base):
    __tablename__ = "device_status"

    device_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    bus_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("buses.bus_id"), nullable=True
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    gps_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    rfid_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    network_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True
    )