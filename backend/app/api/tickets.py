import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_admin
from app.db.session import get_db
from app.models import DigitalTicket, User, Fare, Journey, Trip, RFIDCard
from app.schemas.tickets import BuyTicketRequest, TicketResponse, ValidateTicketRequest

router = APIRouter(tags=["tickets"])

@router.post("/tickets/buy", response_model=TicketResponse)
async def buy_ticket(
    payload: BuyTicketRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    # 1. Look up fare
    fare = await db.scalar(
        select(Fare.amount).where(
            Fare.route_id == payload.route_id,
            Fare.from_stop_id == payload.from_stop_id,
            Fare.to_stop_id == payload.to_stop_id
        )
    )
    if not fare:
        raise HTTPException(400, "Fare not found for this route")

    # 2. Check balance
    if float(current.balance) < float(fare):
        raise HTTPException(400, "Insufficient wallet balance. Please top up.")

    # 3. Deduct balance
    current.balance = float(current.balance) - float(fare)
    
    # 4. Generate Ticket (Valid for 25 minutes)
    qr_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=25)
    
    ticket = DigitalTicket(
        user_id=current.user_id,
        route_id=payload.route_id,
        from_stop_id=payload.from_stop_id,
        to_stop_id=payload.to_stop_id,
        qr_token=qr_token,
        amount_paid=fare,
        expires_at=expires_at
    )
    db.add(ticket)
    await db.commit()

    return TicketResponse(
        ticket_id=str(ticket.ticket_id),
        qr_token=qr_token,
        amount_paid=float(fare),
        expires_at=expires_at.isoformat()
    )

@router.post("/tickets/validate")
async def validate_ticket(
    payload: ValidateTicketRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_admin)], 
):
    # 1. Find ticket
    ticket = await db.scalar(
        select(DigitalTicket).where(DigitalTicket.qr_token == payload.qr_token)
    )
    if not ticket:
        raise HTTPException(404, "Invalid ticket")
    if ticket.status != "ACTIVE":
        raise HTTPException(400, f"Ticket is {ticket.status}")
    if ticket.expires_at < datetime.now(timezone.utc):
        ticket.status = "EXPIRED"
        await db.commit()
        raise HTTPException(400, "Ticket has expired")

    # 2. Verify Trip
    trip = await db.scalar(select(Trip).where(Trip.trip_id == payload.trip_id))
    if not trip:
        raise HTTPException(404, "Trip ID not found")

    # 3. Find the user's RFID card
    linked_card = await db.scalar(
        select(RFIDCard).where(RFIDCard.user_id == ticket.user_id).limit(1)
    )

    if linked_card:
        # Use their actual physical card
        journey_rfid_id = linked_card.rfid_id
    else:
        # Fallback to a virtual card for users with no physical card
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

    # 4. Create Journey using the valid RFID ID
    journey = Journey(
        journey_id=uuid4(),
        rfid_id=journey_rfid_id,  # <--- THIS IS THE FIX: No longer "DIGITAL_QR"
        user_id=ticket.user_id,
        bus_id=trip.bus_id,
        trip_id=trip.trip_id,
        route_id=ticket.route_id,
        boarding_stop_id=ticket.from_stop_id,
        latest_exit_stop_id=ticket.to_stop_id,
        boarding_at=datetime.now(timezone.utc),
        total_fare=ticket.amount_paid,
        amount_collected=ticket.amount_paid,
        outstanding_amount=0,
        financial_state="SETTLED",
        journey_state="ACTIVE",
    )
    db.add(journey)

    # 5. Mark Ticket Used
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