from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bus, Journey, Route, Trip


async def start_trip(
    db: AsyncSession,
    device_id: str,
    bus_id: str,
    route_id: str,
    direction: str | None,
) -> Trip:
    # Validate bus and route
    bus = (await db.execute(select(Bus).where(Bus.bus_id == bus_id))).scalar_one_or_none()
    if not bus:
        raise ValueError(f"Bus {bus_id} not found")
    route = (await db.execute(select(Route).where(Route.route_id == route_id))).scalar_one_or_none()
    if not route:
        raise ValueError(f"Route {route_id} not found")

    # Ensure no other ACTIVE trip on this bus
    existing = (
        await db.execute(
            select(Trip).where(Trip.bus_id == bus_id, Trip.status == "ACTIVE")
        )
    ).scalar_one_or_none()
    if existing:
        raise ValueError(f"Bus {bus_id} already has an active trip {existing.trip_id}")

    # Build trip_id: {mac6}-{YYYYMMDD}-{seq}
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"{bus_id[:6]}-{today}-"

    # Count trips today for this bus
    result = await db.execute(
        select(Trip.trip_id).where(Trip.trip_id.like(f"{prefix}%"))
    )
    existing_ids = [row[0] for row in result.all()]
    seq = len(existing_ids) + 1
    trip_id = f"{prefix}{seq:03d}"

    trip = Trip(
        trip_id=trip_id,
        bus_id=bus_id,
        device_id=device_id,
        route_id=route_id,
        direction=direction,
        status="ACTIVE",
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


async def end_trip(
    db: AsyncSession,
    trip_id: str,
) -> dict:
    trip = (await db.execute(select(Trip).where(Trip.trip_id == trip_id))).scalar_one_or_none()
    if not trip:
        raise ValueError(f"Trip {trip_id} not found")
    if trip.status != "ACTIVE":
        raise ValueError(f"Trip {trip_id} is not ACTIVE (status={trip.status})")

    trip.ended_at = datetime.now(timezone.utc)
    trip.status = "COMPLETED"

    # Close all active journeys for this trip
    result = await db.execute(
        select(Journey).where(
            Journey.trip_id == trip_id,
            Journey.journey_state.in_(["ACTIVE", "POSSIBLE_EXIT"]),
        )
    )
    journeys = result.scalars().all()

    closed = 0
    for j in journeys:
        j.journey_state = "RECONCILED"
        j.ended_at = trip.ended_at
        if j.outstanding_amount and float(j.outstanding_amount) > 0:
            j.financial_state = "PARTIAL"
        else:
            j.financial_state = "SETTLED"
        closed += 1

    await db.commit()
    return {"trip_id": trip_id, "journeys_closed": closed}