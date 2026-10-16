from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.sync import (
    TripEndIn,
    TripStartIn,
    TripStartOut,
)
from app.services.trip_service import end_trip, start_trip

from app.api.device_deps import require_device_key

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/start", response_model=TripStartOut)
async def trips_start(
    payload: TripStartIn,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        trip = await start_trip(
            db,
            device_id=payload.device_id,
            bus_id=payload.bus_id,
            route_id=payload.route_id,
            direction=payload.direction,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return TripStartOut(trip_id=trip.trip_id)


@router.post("/end")
async def trips_end(
    payload: TripEndIn,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        result = await end_trip(db, trip_id=payload.trip_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.get("/active")
async def get_active_trip(
    bus_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: str = Depends(require_device_key),
):
    """
    Returns the current ACTIVE trip for a bus, or null.
    Pi uses this on restart to reuse an open trip instead of failing.
    """
    from sqlalchemy import select as _select
    from app.models import Trip as _Trip

    trip = (
        await db.execute(
            _select(_Trip).where(
                _Trip.bus_id == bus_id,
                _Trip.status == "ACTIVE",
            )
        )
    ).scalar_one_or_none()

    if not trip:
        return {"trip_id": None}
    return {
        "trip_id": trip.trip_id,
        "route_id": trip.route_id,
        "started_at": trip.started_at,
    }