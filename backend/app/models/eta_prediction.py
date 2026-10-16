import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ETAPrediction(Base):
    __tablename__ = "eta_predictions"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    trip_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    stop_id: Mapped[str] = mapped_column(String(32), nullable=False)
    predicted_eta: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )