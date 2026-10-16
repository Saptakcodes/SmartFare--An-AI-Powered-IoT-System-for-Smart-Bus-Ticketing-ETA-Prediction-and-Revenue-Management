from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Journey,
    JourneyEvent,
    RFIDCard,
    RFIDEvent,
    Stop,
    User,
)
from app.services.fare_service import settle_possible_exit


async def _nearest_stop(
    db: AsyncSession,
    route_id: str,
    lat: float,
    lon: float,
    max_distance_m: int = 50,
) -> str | None:
    """Use PostGIS to find the nearest stop on this route within range."""
    from sqlalchemy import text

    sql = text(
        """
        SELECT s.stop_id
        FROM stops s
        JOIN route_stops rs ON rs.stop_id = s.stop_id
        WHERE rs.route_id = :route_id
          AND ST_DWithin(
                s.geog,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                :max_d
              )
        ORDER BY s.geog <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        LIMIT 1
        """
    )
    result = await db.execute(sql, {"route_id": route_id, "lon": lon, "lat": lat, "max_d": max_distance_m})
    row = result.first()
    return row[0] if row else None


async def handle_rfid_event(
    db: AsyncSession,
    event: RFIDEvent,
) -> dict:
    """
    Interpret one RFID detection session.
    Produces:
    - ENTRY: create journey, no charge yet
    - POSSIBLE_EXIT: settle additional fare
    - UNKNOWN: cannot resolve RFID → mark event but don't create journey
    """
    # Resolve RFID → user
    card = (
        await db.execute(
            select(RFIDCard).where(RFIDCard.rfid_id == event.rfid_id)
        )
    ).scalar_one_or_none()

    if not card or card.is_blocked:
        event.event_type = "UNKNOWN"
        await db.commit()
        return {"status": "UNKNOWN_RFID"}

    # Determine stop
    stop_id = event.stop_id
    if not stop_id and event.latitude is not None and event.longitude is not None:
        stop_id = await _nearest_stop(
            db, event.bus_id and event.trip_id and None or None, event.latitude, event.longitude
        )
    # Fallback: verify provided stop
    if stop_id:
        exists = (
            await db.execute(select(Stop.stop_id).where(Stop.stop_id == stop_id))
        ).scalar_one_or_none()
        if not exists:
            stop_id = None

    # Find active journey for this trip + rfid
    journey = None
    if event.trip_id:
        journey = (
            await db.execute(
                select(Journey).where(
                    Journey.trip_id == event.trip_id,
                    Journey.rfid_id == event.rfid_id,
                    Journey.journey_state.in_(["ACTIVE", "POSSIBLE_EXIT"]),
                )
            )
        ).scalar_one_or_none()

    # CASE 1 — ENTRY (no active journey for this trip+rfid)
    if event.event_type == "ENTRY" or journey is None:
        # trip + route lookup
        from app.models import Trip

        trip = (
            await db.execute(select(Trip).where(Trip.trip_id == event.trip_id))
        ).scalar_one_or_none()
        if not trip:
            return {"status": "NO_TRIP"}

        new_journey = Journey(
            journey_id=uuid4(),
            rfid_id=card.rfid_id,
            user_id=card.user_id,
            bus_id=event.bus_id,
            trip_id=trip.trip_id,
            route_id=trip.route_id,
            boarding_stop_id=stop_id,
            boarding_at=event.detected_at,
            started_at=event.detected_at,
            journey_state="ACTIVE",
            financial_state="PENDING",
        )
        db.add(new_journey)
        await db.flush()

        db.add(
            JourneyEvent(
                event_id=uuid4(),
                journey_id=new_journey.journey_id,
                event_type="STARTED",
                to_stop_id=stop_id,
                amount_delta=0,
            )
        )

        event.journey_id = new_journey.journey_id
        event.event_type = "ENTRY"
        await db.commit()
        return {"status": "JOURNEY_STARTED", "journey_id": str(new_journey.journey_id)}

    # CASE 2 — POSSIBLE_EXIT (active journey found)
    if stop_id is None:
        event.journey_id = journey.journey_id
        await db.commit()
        return {"status": "NO_STOP_MATCH"}

    # Fetch fare lookup + settlement
    settlement = await settle_possible_exit(db, journey, stop_id)

    journey.latest_exit_at = event.detected_at
    journey.journey_state = "POSSIBLE_EXIT"
    event.journey_id = journey.journey_id
    event.event_type = "POSSIBLE_EXIT"

    db.add(
        JourneyEvent(
            event_id=uuid4(),
            journey_id=journey.journey_id,
            event_type="POSSIBLE_EXIT",
            to_stop_id=stop_id,
            amount_delta=settlement.get("additional", 0),
        )
    )
    await db.commit()
    return {"status": "POSSIBLE_EXIT", "settlement": settlement}