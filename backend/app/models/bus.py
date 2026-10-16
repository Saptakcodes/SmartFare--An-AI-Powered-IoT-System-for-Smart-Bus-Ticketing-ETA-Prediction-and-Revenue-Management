from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Bus(Base):
    __tablename__ = "buses"

    bus_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    plate_no: Mapped[str | None] = mapped_column(
        String(32), unique=True, nullable=True
    )
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )