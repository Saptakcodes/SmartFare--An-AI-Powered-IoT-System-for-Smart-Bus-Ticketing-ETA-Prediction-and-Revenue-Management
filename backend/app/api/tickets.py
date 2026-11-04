import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import uuid4
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_admin
from app.db.session import get_db
from app.models import DigitalTicket, User, Fare, Journey, Trip, RFIDCard, Admin, Notification
from app.schemas.tickets import BuyTicketRequest, TicketResponse, ValidateTicketRequest

router = APIRouter(tags=["tickets"])

@router.post("/tickets/buy", response_model=TicketResponse)
async def buy_ticket(
    payload: BuyTicketRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    # 0. Lock user
    user = await db.scalar(
        select(User).where(User.user_id == current.user_id).with_for_update()
    )
    
    # 1. Look up fare
    fare = await db.scalar(
        select(Fare.amount).where(
            Fare.route_id == payload.route_id,
            Fare.from_stop_id == payload.from_stop_id,
            Fare.to_stop_id == payload.to_stop_id
        )
    )
    
    if fare is None:
        raise HTTPException(400, f"Fare not found for route={payload.route_id}, from={payload.from_stop_id}, to={payload.to_stop_id}")

    fare_decimal = Decimal(str(fare))

    # 2. Idempotency
    existing_ticket = await db.scalar(
        select(DigitalTicket).where(
            DigitalTicket.user_id == user.user_id,
            DigitalTicket.route_id == payload.route_id,
            DigitalTicket.from_stop_id == payload.from_stop_id,
            DigitalTicket.to_stop_id == payload.to_stop_id,
            DigitalTicket.status == "ACTIVE",
            DigitalTicket.expires_at > datetime.now(timezone.utc)
        )
    )
    if existing_ticket:
        return TicketResponse(
            ticket_id=str(existing_ticket.ticket_id),
            qr_token=existing_ticket.qr_token,
            amount_paid=float(existing_ticket.amount_paid),
            expires_at=existing_ticket.expires_at.isoformat()
        )

    # 3. Deduct balance (Allow Negative / Overdraft)
    user.balance = Decimal(str(user.balance)) - fare_decimal
    
    # If balance is now below 0, block their RFID card
    if user.balance < 0:
        await db.execute(
            update(RFIDCard).where(RFIDCard.user_id == user.user_id).values(is_blocked=True)
        )
        db.add(Notification(
            user_id=user.user_id,
            title="Card Blocked - Negative Balance",
            body="Your wallet balance dropped below zero. Your RFID card has been temporarily blocked. Please top up to unblock.",
            type="error"
        ))
    elif user.balance < Decimal("50.00"):
        db.add(Notification(
            user_id=user.user_id,
            title="Low Balance Warning",
            body=f"Your balance is ₹{user.balance}. Please top up to avoid interruptions.",
            type="warning"
        ))
    
    # 4. Generate Ticket
    qr_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=25)
    
    ticket = DigitalTicket(
        user_id=user.user_id,
        route_id=payload.route_id,
        from_stop_id=payload.from_stop_id,
        to_stop_id=payload.to_stop_id,
        qr_token=qr_token,
        amount_paid=fare_decimal,
        expires_at=expires_at
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return TicketResponse(
        ticket_id=str(ticket.ticket_id),
        qr_token=qr_token,
        amount_paid=float(fare_decimal),
        expires_at=expires_at.isoformat()
    )

@router.post("/tickets/validate")
async def validate_ticket(
    payload: ValidateTicketRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Admin, Depends(get_current_admin)],
):
    ticket = await db.scalar(
        select(DigitalTicket).where(DigitalTicket.qr_token == payload.qr_token).with_for_update()
    )
    if not ticket:
        raise HTTPException(404, "Invalid ticket")
    if ticket.status != "ACTIVE":
        raise HTTPException(400, f"Ticket is {ticket.status}")
    if ticket.expires_at < datetime.now(timezone.utc):
        ticket.status = "EXPIRED"
        await db.commit()
        raise HTTPException(400, "Ticket has expired")

    trip = await db.scalar(select(Trip).where(Trip.trip_id == payload.trip_id))
    if not trip:
        raise HTTPException(404, "Trip ID not found")

    linked_card = await db.scalar(
        select(RFIDCard).where(RFIDCard.user_id == ticket.user_id).limit(1)
    )

    if linked_card:
        journey_rfid_id = linked_card.rfid_id
    else:
        journey_rfid_id = f"VIRTUAL-{str(ticket.user_id)[:8]}"
        existing_virtual = await db.scalar(
            select(RFIDCard).where(RFIDCard.rfid_id == journey_rfid_id)
        )
        if not existing_virtual:
            virtual_card = RFIDCard(
                rfid_id=journey_rfid_id,
                user_id=ticket.user_id,
                is_blocked=False
            )
            db.add(virtual_card)
            await db.flush()

    journey = Journey(
        journey_id=uuid4(),
        rfid_id=journey_rfid_id,
        user_id=ticket.user_id,
        bus_id=trip.bus_id,
        trip_id=trip.trip_id,
        route_id=ticket.route_id,
        boarding_stop_id=ticket.from_stop_id,
        latest_exit_stop_id=ticket.to_stop_id,
        boarding_at=datetime.now(timezone.utc),
        total_fare=ticket.amount_paid,
        amount_collected=ticket.amount_paid,
        outstanding_amount=Decimal("0.00"),
        financial_state="SETTLED",
        journey_state="ACTIVE",
    )
    db.add(journey)

    ticket.status = "USED"
    ticket.used_at = datetime.now(timezone.utc)
    
    await db.commit()
    return {"status": "success", "message": "Ticket validated, passenger boarded.", "journey_id": str(journey.journey_id)}

@router.get("/tickets/me")
async def get_my_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    tickets = (
        await db.execute(
            select(DigitalTicket)
            .where(DigitalTicket.user_id == current.user_id)
            .order_by(DigitalTicket.created_at.desc())
            .limit(20)
        )
    ).scalars().all()
    
    now = datetime.now(timezone.utc)
    result = []
    
    for t in tickets:
        if t.status == "ACTIVE" and t.expires_at < now:
            t.status = "EXPIRED"
            
        result.append({
            "ticket_id": str(t.ticket_id),
            "qr_token": t.qr_token,
            "amount_paid": float(t.amount_paid),
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "expires_at": t.expires_at.isoformat()
        })
        
    await db.commit()
    return result