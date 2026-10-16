from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import uuid4
from app.schemas.passenger import TopUpRequest, TopUpResponse
from decimal import Decimal

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Journey,
    RFIDCard,
    Route,
    RouteStop,
    Stop,
    Transaction,
    User,
)
from app.schemas.passenger import (
    JourneyListItem,
    LinkRFIDRequest,
    RFIDCardItem,
    RouteDetail,
    RouteListItem,
    RouteSearchResult,
    RouteStopItem,
    StopListItem,
    TransactionListItem,
)


router = APIRouter(tags=["passenger"])


# ---------------------------------------------------------------------------
# Stops
# ---------------------------------------------------------------------------


@router.get("/stops", response_model=list[StopListItem])
async def list_stops(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = Query(default=None, description="Search by name"),
    limit: int = Query(default=50, le=200),
):
    sql = """
        SELECT stop_id, name,
               ST_Y(geog::geometry) AS lat,
               ST_X(geog::geometry) AS lon
        FROM stops
    """
    params: dict = {"limit": limit}
    if q:
        sql += " WHERE name ILIKE :q "
        params["q"] = f"%{q}%"
    sql += " ORDER BY name LIMIT :limit"

    rows = (await db.execute(text(sql), params)).all()
    return [
        StopListItem(stop_id=r[0], name=r[1], latitude=r[2], longitude=r[3])
        for r in rows
    ]


@router.get("/stops/nearby", response_model=list[StopListItem])
async def nearby_stops(
    db: Annotated[AsyncSession, Depends(get_db)],
    lat: float = Query(...),
    lon: float = Query(...),
    radius_m: int = Query(default=1500, le=10000),
    limit: int = Query(default=20, le=100),
):
    sql = """
        SELECT stop_id, name,
               ST_Y(geog::geometry) AS lat,
               ST_X(geog::geometry) AS lon
        FROM stops
        WHERE ST_DWithin(
            geog,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius
        )
        ORDER BY geog <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        LIMIT :limit
    """
    rows = (
        await db.execute(
            text(sql),
            {"lat": lat, "lon": lon, "radius": radius_m, "limit": limit},
        )
    ).all()
    return [
        StopListItem(stop_id=r[0], name=r[1], latitude=r[2], longitude=r[3])
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/routes", response_model=list[RouteListItem])
async def list_routes(
    db: Annotated[AsyncSession, Depends(get_db)],
    active_only: bool = True,
):
    stmt = select(Route)
    if active_only:
        stmt = stmt.where(Route.is_active.is_(True))
    routes = (await db.execute(stmt.order_by(Route.name))).scalars().all()

    result: list[RouteListItem] = []
    for r in routes:
        count = len(
            (
                await db.execute(
                    select(RouteStop).where(RouteStop.route_id == r.route_id)
                )
            )
            .scalars()
            .all()
        )
        result.append(
            RouteListItem(
                route_id=r.route_id,
                name=r.name,
                description=r.description,
                stops_count=count,
                is_active=r.is_active,
            )
        )
    return result


@router.get("/routes/search", response_model=list[RouteSearchResult])
async def search_routes(
    db: Annotated[AsyncSession, Depends(get_db)],
    source_stop_id: str = Query(...),
    destination_stop_id: str = Query(...),
):
    """
    Find routes that contain both stops, with source appearing before
    destination in sequence.
    """
    sql = """
        SELECT r.route_id, r.name,
               s1.seq AS src_seq, s2.seq AS dst_seq
        FROM routes r
        JOIN route_stops s1 ON s1.route_id = r.route_id AND s1.stop_id = :src
        JOIN route_stops s2 ON s2.route_id = r.route_id AND s2.stop_id = :dst
        WHERE s1.seq < s2.seq
          AND r.is_active = true
        ORDER BY r.name
    """
    rows = (
        await db.execute(
            text(sql),
            {"src": source_stop_id, "dst": destination_stop_id},
        )
    ).all()

    if not rows:
        return []

    # Fetch stop names once
    stops = (
        await db.execute(
            select(Stop).where(
                Stop.stop_id.in_([source_stop_id, destination_stop_id])
            )
        )
    ).scalars().all()
    name_map = {s.stop_id: s.name for s in stops}

    # Count stops per route
    results: list[RouteSearchResult] = []
    for r in rows:
        route_id = r[0]
        stops_count = len(
            (
                await db.execute(
                    select(RouteStop).where(RouteStop.route_id == route_id)
                )
            )
            .scalars()
            .all()
        )
        results.append(
            RouteSearchResult(
                route_id=route_id,
                name=r[1],
                source_stop_id=source_stop_id,
                source_stop_name=name_map.get(source_stop_id, ""),
                destination_stop_id=destination_stop_id,
                destination_stop_name=name_map.get(destination_stop_id, ""),
                stops_count=stops_count,
            )
        )
    return results


@router.get("/routes/{route_id}", response_model=RouteDetail)
async def route_detail(
    route_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    route = (
        await db.execute(select(Route).where(Route.route_id == route_id))
    ).scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    sql = """
        SELECT s.stop_id, s.name, rs.seq,
               ST_Y(s.geog::geometry) AS lat,
               ST_X(s.geog::geometry) AS lon
        FROM stops s
        JOIN route_stops rs ON rs.stop_id = s.stop_id
        WHERE rs.route_id = :rid
        ORDER BY rs.seq
    """
    rows = (await db.execute(text(sql), {"rid": route_id})).all()

    return RouteDetail(
        route_id=route.route_id,
        name=route.name,
        description=route.description,
        is_active=route.is_active,
        stops=[
            RouteStopItem(
                stop_id=r[0],
                name=r[1],
                seq=r[2],
                latitude=r[3],
                longitude=r[4],
            )
            for r in rows
        ],
    )


# ---------------------------------------------------------------------------
# My journeys
# ---------------------------------------------------------------------------


@router.get("/journeys/me", response_model=list[JourneyListItem])
async def my_journeys(
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    limit: int = Query(default=50, le=200),
):
    journeys = (
        (
            await db.execute(
                select(Journey)
                .where(Journey.user_id == current.user_id)
                .order_by(Journey.started_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )

    # Fetch route names + stop names in bulk
    route_ids = list({j.route_id for j in journeys})
    stop_ids = set()
    for j in journeys:
        if j.boarding_stop_id:
            stop_ids.add(j.boarding_stop_id)
        if j.latest_exit_stop_id:
            stop_ids.add(j.latest_exit_stop_id)

    route_names: dict[str, str] = {}
    if route_ids:
        routes = (
            await db.execute(select(Route).where(Route.route_id.in_(route_ids)))
        ).scalars().all()
        route_names = {r.route_id: r.name for r in routes}

    stop_names: dict[str, str] = {}
    if stop_ids:
        stops = (
            await db.execute(select(Stop).where(Stop.stop_id.in_(stop_ids)))
        ).scalars().all()
        stop_names = {s.stop_id: s.name for s in stops}

    return [
        JourneyListItem(
            journey_id=j.journey_id,
            trip_id=j.trip_id,
            bus_id=j.bus_id,
            route_id=j.route_id,
            route_name=route_names.get(j.route_id),
            boarding_stop_id=j.boarding_stop_id,
            boarding_stop_name=stop_names.get(j.boarding_stop_id or ""),
            latest_exit_stop_id=j.latest_exit_stop_id,
            latest_exit_stop_name=stop_names.get(j.latest_exit_stop_id or ""),
            total_fare=float(j.total_fare or 0),
            amount_collected=float(j.amount_collected or 0),
            outstanding_amount=float(j.outstanding_amount or 0),
            financial_state=j.financial_state,
            journey_state=j.journey_state,
            started_at=j.started_at,
            ended_at=j.ended_at,
        )
        for j in journeys
    ]


# ---------------------------------------------------------------------------
# My transactions
# ---------------------------------------------------------------------------


@router.get("/transactions/me", response_model=list[TransactionListItem])
async def my_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    limit: int = Query(default=100, le=500),
):
    txns = (
        (
            await db.execute(
                select(Transaction)
                .where(Transaction.user_id == current.user_id)
                .order_by(Transaction.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return [
        TransactionListItem(
            transaction_id=t.transaction_id,
            journey_id=t.journey_id,
            amount=float(t.amount),
            type=t.type,
            balance_after=float(t.balance_after) if t.balance_after is not None else None,
            notes=t.notes,
            created_at=t.created_at,
        )
        for t in txns
    ]


# ---------------------------------------------------------------------------
# RFID cards
# ---------------------------------------------------------------------------


@router.get("/rfid/me", response_model=list[RFIDCardItem])
async def my_rfid_cards(
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    cards = (
        (
            await db.execute(
                select(RFIDCard).where(RFIDCard.user_id == current.user_id)
            )
        )
        .scalars()
        .all()
    )
    return [
        RFIDCardItem(
            rfid_id=c.rfid_id,
            is_blocked=c.is_blocked,
            issued_at=c.issued_at,
        )
        for c in cards
    ]


@router.post("/rfid/link", response_model=RFIDCardItem)
async def link_rfid(
    payload: LinkRFIDRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    existing = (
        await db.execute(
            select(RFIDCard).where(RFIDCard.rfid_id == payload.rfid_id)
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="RFID card already linked")

    card = RFIDCard(rfid_id=payload.rfid_id, user_id=current.user_id)
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return RFIDCardItem(
        rfid_id=card.rfid_id,
        is_blocked=card.is_blocked,
        issued_at=card.issued_at,
    )


#DELETE Rfid

@router.delete("/rfid/{rfid_id}")
async def unlink_rfid(
    rfid_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    card = (
        await db.execute(
            select(RFIDCard).where(
                RFIDCard.rfid_id == rfid_id,
                RFIDCard.user_id == current.user_id,
            )
        )
    ).scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    await db.delete(card)
    await db.commit()
    return {"message": "Card unlinked"}

#wallet+journey history

@router.post("/wallet/topup", response_model=TopUpResponse)
async def top_up(
    payload: TopUpRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    import uuid as _uuid

    from app.schemas.passenger import TopUpResponse

    amount = Decimal(str(payload.amount))
    if amount <= 0 or amount > Decimal("10000"):
        raise HTTPException(status_code=400, detail="Invalid amount")

    user = (
        await db.execute(select(User).where(User.user_id == current.user_id))
    ).scalar_one()
    user.balance = Decimal(user.balance or 0) + amount

    txn = Transaction(
        transaction_id=_uuid.uuid4(),
        journey_id=None,
        user_id=user.user_id,
        amount=amount,
        type="TOPUP",
        balance_after=user.balance,
        notes="Wallet top up",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)

    return TopUpResponse(balance=float(user.balance), transaction_id=txn.transaction_id)

@router.get("/buses/live")
async def live_buses(
    db: Annotated[AsyncSession, Depends(get_db)],
    minutes: int = Query(default=10, ge=1, le=120),
):
    """
    Latest known position of each bus.
    Only includes buses with GPS activity in the last N minutes.
    """
    sql = text(
        """
        SELECT DISTINCT ON (gr.bus_id)
            gr.bus_id,
            gr.trip_id,
            gr.latitude,
            gr.longitude,
            gr.speed_kmph,
            gr.recorded_at,
            t.route_id,
            t.direction,
            t.status AS trip_status
        FROM gps_records gr
        LEFT JOIN trips t ON t.trip_id = gr.trip_id
        WHERE gr.recorded_at > now() - (:minutes || ' minutes')::interval
        ORDER BY gr.bus_id, gr.recorded_at DESC
        """
    )
    rows = (await db.execute(sql, {"minutes": minutes})).all()
    return [
        {
            "bus_id": r[0],
            "trip_id": r[1],
            "latitude": r[2],
            "longitude": r[3],
            "speed_kmph": float(r[4]) if r[4] is not None else None,
            "recorded_at": r[5].isoformat() if r[5] else None,
            "route_id": r[6],
            "direction": r[7],
            "trip_status": r[8],
        }
        for r in rows
    ]