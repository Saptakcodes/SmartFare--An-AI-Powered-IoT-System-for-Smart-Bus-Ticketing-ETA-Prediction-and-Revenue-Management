from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Fare(Base):
    __tablename__ = "fares"

    route_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("routes.route_id", ondelete="CASCADE"),
        primary_key=True,
    )
    from_stop_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("stops.stop_id"), primary_key=True
    )
    to_stop_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("stops.stop_id"), primary_key=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)