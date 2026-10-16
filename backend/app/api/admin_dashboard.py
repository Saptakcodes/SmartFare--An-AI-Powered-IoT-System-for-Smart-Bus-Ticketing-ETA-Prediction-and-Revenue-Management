from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models import Admin, Bus, DeviceStatus, Journey, Route, Stop, Transaction
from app.schemas.admin_dashboard import (
    DeviceHealthItem,
    FleetBusItem,
    JourneyAdminItem,
    OverviewResponse,
    RevenueByRoute,
    RevenueResponse,
)

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


@router.get("/overview", response_model=OverviewResponse)
async def overview(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    # Revenue
    rev_today = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == "FARE_UPDATE",
            Transaction.created_at >= today_start,
        )
    )
    rev_yest = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == "FARE_UPDATE",
            Transaction.created_at >= yesterday_start,
            Transaction.created_at < today_start,
        )
    )

    def pct(curr, prev) -> float:
        c, p = float(curr or 0), float(prev or 0)
        if p == 0:
            return 0.0
        return round(((c - p) / p) * 100, 1)

    # Journeys
    j_today = await db.scalar(
        select(func.count(Journey.journey_id)).where(
            Journey.started_at >= today_start
        )
    )
    j_yest = await db.scalar(
        select(func.count(Journey.journey_id)).where(
            Journey.started_at >= yesterday_start,
            Journey.started_at < today_start,
        )
    )

    # Buses
    total_buses = await db.scalar(
        select(func.count(Bus.bus_id)).where(Bus.is_active.is_(True))
    ) or 0

    # Active trips
    active_trips = await db.scalar(
        text("SELECT COUNT(*) FROM trips WHERE status = 'ACTIVE'")
    ) or 0

    # Active buses = buses with recent GPS
    active_buses = await db.scalar(
        text(
            "SELECT COUNT(DISTINCT bus_id) FROM gps_records "
            "WHERE recorded_at > now() - interval '10 minutes'"
        )
    ) or 0

    # Devices
    devices_total = await db.scalar(select(func.count(DeviceStatus.device_id))) or 0
    devices_online = await db.scalar(
        text(
            "SELECT COUNT(*) FROM device_status "
            "WHERE last_seen_at > now() - interval '5 minutes'"
        )
    ) or 0

    return OverviewResponse(
        revenue_today=float(rev_today or 0),
        revenue_yesterday=float(rev_yest or 0),
        revenue_delta_pct=pct(rev_today, rev_yest),
        journeys_today=int(j_today or 0),
        journeys_yesterday=int(j_yest or 0),
        journeys_delta_pct=pct(j_today, j_yest),
        active_buses=int(active_buses),
        total_buses=int(total_buses),
        active_trips=int(active_trips),
        devices_online=int(devices_online),
        devices_total=int(devices_total),
    )


@router.get("/fleet", response_model=list[FleetBusItem])
async def fleet(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
):
    rows = (
        await db.execute(
            text(
                """
                SELECT DISTINCT ON (b.bus_id)
                    b.bus_id,
                    gr.trip_id,
                    t.route_id,
                    gr.latitude,
                    gr.longitude,
                    gr.speed_kmph,
                    gr.recorded_at
                FROM buses b
                LEFT JOIN gps_records gr ON gr.bus_id = b.bus_id
                    AND gr.recorded_at > now() - interval '30 minutes'
                LEFT JOIN trips t ON t.trip_id = gr.trip_id
                WHERE b.is_active = true
                ORDER BY b.bus_id, gr.recorded_at DESC NULLS LAST
                """
            )
        )
    ).all()

    now = datetime.now(timezone.utc)
    items: list[FleetBusItem] = []
    for r in rows:
        recorded = r[6]
        status = "offline"
        if recorded:
            age = (now - recorded).total_seconds()
            if age < 120:
                status = "online"
            elif age < 900:
                status = "idle"

        items.append(
            FleetBusItem(
                bus_id=r[0],
                trip_id=r[1],
                route_id=r[2],
                latitude=r[3],
                longitude=r[4],
                speed_kmph=float(r[5]) if r[5] is not None else None,
                recorded_at=r[6],
                status=status,
            )
        )
    return items


@router.get("/journeys", response_model=list[JourneyAdminItem])
async def admin_journeys(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
    limit: int = Query(default=100, le=500),
):
    rows = (
        await db.execute(
            text(
                """
                SELECT j.journey_id::text, u.email, j.rfid_id, j.bus_id, j.trip_id,
                       j.route_id, r.name AS route_name,
                       bs.name AS boarding_name, es.name AS exit_name,
                       j.total_fare, j.amount_collected, j.outstanding_amount,
                       j.financial_state, j.journey_state,
                       j.started_at, j.ended_at
                FROM journeys j
                LEFT JOIN users u ON u.user_id = j.user_id
                LEFT JOIN routes r ON r.route_id = j.route_id
                LEFT JOIN stops bs ON bs.stop_id = j.boarding_stop_id
                LEFT JOIN stops es ON es.stop_id = j.latest_exit_stop_id
                ORDER BY j.started_at DESC
                LIMIT :limit
                """
            ),
            {"limit": limit},
        )
    ).all()

    return [
        JourneyAdminItem(
            journey_id=r[0],
            user_email=r[1],
            rfid_id=r[2],
            bus_id=r[3],
            trip_id=r[4],
            route_id=r[5],
            route_name=r[6],
            boarding_stop_name=r[7],
            latest_exit_stop_name=r[8],
            total_fare=float(r[9] or 0),
            amount_collected=float(r[10] or 0),
            outstanding_amount=float(r[11] or 0),
            financial_state=r[12],
            journey_state=r[13],
            started_at=r[14],
            ended_at=r[15],
        )
        for r in rows
    ]


@router.get("/revenue", response_model=RevenueResponse)
async def admin_revenue(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    total = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == "FARE_UPDATE",
            Transaction.created_at >= since,
        )
    ) or 0
    count = await db.scalar(
        select(func.count(Transaction.transaction_id)).where(
            Transaction.type == "FARE_UPDATE",
            Transaction.created_at >= since,
        )
    ) or 0
    avg = float(total) / int(count) if count else 0.0

    by_route_rows = (
        await db.execute(
            text(
                """
                SELECT r.route_id, r.name,
                       COALESCE(SUM(t.amount), 0) AS revenue,
                       COUNT(DISTINCT j.journey_id) AS journeys
                FROM routes r
                LEFT JOIN journeys j ON j.route_id = r.route_id
                    AND j.started_at >= :since
                LEFT JOIN transactions t ON t.journey_id = j.journey_id
                    AND t.type = 'FARE_UPDATE'
                GROUP BY r.route_id, r.name
                ORDER BY revenue DESC
                """
            ),
            {"since": since},
        )
    ).all()

    return RevenueResponse(
        total_revenue=float(total),
        total_transactions=int(count),
        average_fare=round(avg, 2),
        by_route=[
            RevenueByRoute(
                route_id=r[0],
                route_name=r[1],
                revenue=float(r[2] or 0),
                journeys=int(r[3] or 0),
            )
            for r in by_route_rows
        ],
    )


@router.get("/devices", response_model=list[DeviceHealthItem])
async def admin_devices(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
):
    rows = (
        await db.execute(
            text(
                """
                SELECT device_id, bus_id, last_seen_at,
                       gps_ok, rfid_ok, network_ok, app_version
                FROM device_status
                ORDER BY last_seen_at DESC NULLS LAST
                """
            )
        )
    ).all()

    now = datetime.now(timezone.utc)
    out: list[DeviceHealthItem] = []
    for r in rows:
        last_seen = r[2]
        age_min = None
        status = "offline"
        if last_seen:
            age_min = int((now - last_seen).total_seconds() / 60)
            if age_min < 5:
                status = "online"
            elif age_min < 60:
                status = "stale"

        out.append(
            DeviceHealthItem(
                device_id=r[0],
                bus_id=r[1],
                last_seen_at=last_seen,
                gps_ok=r[3],
                rfid_ok=r[4],
                network_ok=r[5],
                app_version=r[6],
                minutes_since_seen=age_min,
                status=status,
            )
        )
    return out