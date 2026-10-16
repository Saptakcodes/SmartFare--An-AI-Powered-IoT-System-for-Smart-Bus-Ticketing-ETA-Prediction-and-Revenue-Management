import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import (
    DeviceStatus,
    Fare,
    GPSRecord,
    RFIDCard,
    RFIDEvent,
    RouteStop,
    Stop,
    SyncLog,
    Transaction,
    Trip,
)
from app.schemas.sync import (
    DeviceHeartbeatIn,
    FareCacheItem,
    RFIDCacheItem,
    RFIDCacheOut,
    StopCacheItem,
    SyncBatchIn,
    SyncBatchOut,
    SyncEventResult,
)
from app.services.journey_service import handle_rfid_event


router = APIRouter(prefix="/sync", tags=["sync"])


async def _already_synced(db: AsyncSession, event_id: uuid.UUID) -> bool:
    row = (
        await db.execute(select(SyncLog.sync_id).where(SyncLog.event_id == event_id))
    ).scalar_one_or_none()
    return row is not None


async def _log(
    db: AsyncSession,
    device_id: str,
    event_id: uuid.UUID,
    event_type: str,
    status: str,
    payload: dict,
    error: str | None = None,
):
    db.add(
        SyncLog(
            device_id=device_id,
            event_id=event_id,
            event_type=event_type,
            status=status,
            error_message=error,
            payload=payload,
        )
    )


@router.post("/events", response_model=SyncBatchOut)
async def sync_events(
    payload: SyncBatchIn,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    results: list[SyncEventResult] = []
    ok = dup = err = 0

    for env in payload.events:
        try:
            event_uuid = uuid.UUID(env.event_id)
        except ValueError:
            results.append(SyncEventResult(event_id=env.event_id, status="ERROR", error="invalid UUID"))
            err += 1
            continue

        if await _already_synced(db, event_uuid):
            results.append(SyncEventResult(event_id=env.event_id, status="DUPLICATE"))
            dup += 1
            continue

        try:
            if env.event_type == "GPS_UPDATE":
                g = env.payload
                lat = float(g["latitude"])
                lon = float(g["longitude"])
                db.add(
                    GPSRecord(
                        gps_id=event_uuid,
                        device_id=g.get("device_id", payload.device_id),
                        bus_id=g.get("bus_id", payload.bus_id),
                        trip_id=g["trip_id"],
                        latitude=lat,
                        longitude=lon,
                        geog=f"SRID=4326;POINT({lon} {lat})",
                        speed_kmph=g.get("speed_kmph"),
                        gps_utc_time=g.get("gps_utc_time"),
                        gps_date=g.get("gps_date"),
                        recorded_at=datetime.fromisoformat(g["recorded_at"]),
                    )
                )

            elif env.event_type == "RFID_EVENT":
                r = env.payload
                lat = r.get("latitude")
                lon = r.get("longitude")
                geog = f"SRID=4326;POINT({lon} {lat})" if lat is not None and lon is not None else None

                rfid_event = RFIDEvent(
                    event_id=event_uuid,
                    device_id=r.get("device_id", payload.device_id),
                    epc=r["epc"],
                    rfid_id=r.get("rfid_id"),
                    user_id=None,
                    bus_id=r.get("bus_id", payload.bus_id),
                    trip_id=r.get("trip_id"),
                    event_type=r["event_type"],
                    stop_id=r.get("stop_id"),
                    latitude=lat,
                    longitude=lon,
                    geog=geog,
                    speed_kmph=r.get("speed_kmph"),
                    gps_utc_time=r.get("gps_utc_time"),
                    gps_date=r.get("gps_date"),
                    session_started_at=datetime.fromisoformat(r["session_started_at"]),
                    session_ended_at=(
                        datetime.fromisoformat(r["session_ended_at"])
                        if r.get("session_ended_at")
                        else None
                    ),
                    detected_at=datetime.fromisoformat(r["detected_at"]),
                )
                db.add(rfid_event)
                await db.flush()

                # Resolve RFID → user via card table
                card = (
                    await db.execute(
                        select(RFIDCard).where(RFIDCard.rfid_id == r.get("rfid_id") or "")
                    )
                ).scalar_one_or_none()
                if not card:
                    # Try epc-based lookup
                    card = (
                        await db.execute(
                            select(RFIDCard).where(RFIDCard.rfid_id == r["epc"])
                        )
                    ).scalar_one_or_none()

                if card:
                    rfid_event.rfid_id = card.rfid_id
                    rfid_event.user_id = card.user_id
                    await db.flush()
                    await handle_rfid_event(db, rfid_event)
                else:
                    rfid_event.event_type = "UNKNOWN"
                    await db.commit()

            elif env.event_type == "TRANSACTION":
                t = env.payload
                db.add(
                    Transaction(
                        transaction_id=event_uuid,
                        journey_id=uuid.UUID(t["journey_id"]) if t.get("journey_id") else None,
                        user_id=uuid.UUID(t["user_id"]),
                        amount=t["amount"],
                        type=t["type"],
                        balance_after=t.get("balance_after"),
                        notes=t.get("notes"),
                        created_at=datetime.fromisoformat(t["created_at"]),
                    )
                )

            # Unknown but tolerated
            await _log(
                db,
                payload.device_id,
                event_uuid,
                env.event_type,
                "OK",
                env.payload,
            )
            await db.commit()
            results.append(SyncEventResult(event_id=env.event_id, status="OK"))
            ok += 1

        except Exception as e:
            await db.rollback()
            await _log(
                db,
                payload.device_id,
                event_uuid,
                env.event_type,
                "ERROR",
                env.payload,
                str(e),
            )
            await db.commit()
            results.append(
                SyncEventResult(event_id=env.event_id, status="ERROR", error=str(e))
            )
            err += 1

    # Update device heartbeat
    existing_device = (
        await db.execute(
            select(DeviceStatus).where(DeviceStatus.device_id == payload.device_id)
        )
    ).scalar_one_or_none()
    if existing_device:
        existing_device.last_seen_at = datetime.now(timezone.utc)
    else:
        db.add(
            DeviceStatus(
                device_id=payload.device_id,
                bus_id=payload.bus_id,
                last_seen_at=datetime.now(timezone.utc),
            )
        )
    await db.commit()

    return SyncBatchOut(
        received=len(payload.events),
        ok=ok,
        duplicates=dup,
        errors=err,
        results=results,
    )


@router.get("/route/{route_id}/stops", response_model=list[StopCacheItem])
async def cache_stops(
    route_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from sqlalchemy import text

    sql = text(
        """
        SELECT s.stop_id, s.name, rs.seq,
               ST_Y(s.geog::geometry) AS lat,
               ST_X(s.geog::geometry) AS lon
        FROM stops s
        JOIN route_stops rs ON rs.stop_id = s.stop_id
        WHERE rs.route_id = :rid
        ORDER BY rs.seq
        """
    )
    rows = (await db.execute(sql, {"rid": route_id})).all()
    return [
        StopCacheItem(
            stop_id=r[0], name=r[1], seq=r[2], latitude=r[3], longitude=r[4]
        )
        for r in rows
    ]


@router.get("/route/{route_id}/fares", response_model=list[FareCacheItem])
async def cache_fares(
    route_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    rows = (
        await db.execute(select(Fare).where(Fare.route_id == route_id))
    ).scalars().all()
    return [
        FareCacheItem(
            from_stop_id=f.from_stop_id,
            to_stop_id=f.to_stop_id,
            amount=float(f.amount),
        )
        for f in rows
    ]


@router.get("/rfid-cache", response_model=RFIDCacheOut)
async def rfid_cache(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    rows = (await db.execute(select(RFIDCard))).scalars().all()
    return RFIDCacheOut(
        generated_at=datetime.now(timezone.utc),
        items=[
            RFIDCacheItem(
                epc=c.rfid_id,
                rfid_id=c.rfid_id,
                user_id=str(c.user_id),
                is_blocked=c.is_blocked,
            )
            for c in rows
        ],
    )


@router.post("/device/heartbeat")
async def device_heartbeat(
    payload: DeviceHeartbeatIn,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = (
        await db.execute(
            select(DeviceStatus).where(DeviceStatus.device_id == payload.device_id)
        )
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if existing:
        existing.last_seen_at = now
        existing.bus_id = payload.bus_id or existing.bus_id
        existing.gps_ok = payload.gps_ok
        existing.rfid_ok = payload.rfid_ok
        existing.network_ok = payload.network_ok
        existing.app_version = payload.app_version
        existing.metadata_ = payload.metadata
    else:
        db.add(
            DeviceStatus(
                device_id=payload.device_id,
                bus_id=payload.bus_id,
                last_seen_at=now,
                gps_ok=payload.gps_ok,
                rfid_ok=payload.rfid_ok,
                network_ok=payload.network_ok,
                app_version=payload.app_version,
                metadata_=payload.metadata,
            )
        )
    await db.commit()
    return {"status": "ok"}