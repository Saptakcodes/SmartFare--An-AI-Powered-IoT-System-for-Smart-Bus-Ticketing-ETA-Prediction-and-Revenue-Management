from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from pydantic import BaseModel
from typing import Annotated
import uuid
from decimal import Decimal

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models import User, Transaction, Notification, RFIDCard

router = APIRouter(prefix="/mock-payment", tags=["mock-payment"])

class CreateOrderRequest(BaseModel):
    amount: float

class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str  # ADDED: To store the fake Razorpay Payment ID
    amount: float

@router.post("/create-order")
async def create_mock_order(
    payload: CreateOrderRequest, 
    current: Annotated[User, Depends(get_current_user)]
):
    """Simulates creating an order on Razorpay."""
    if payload.amount <= 0:
        raise HTTPException(400, "Invalid amount")
        
    return {
        "id": f"order_{uuid.uuid4().hex[:14]}",
        "amount": int(payload.amount * 100), # Convert to paise
        "currency": "INR",
        "status": "created"
    }

@router.post("/verify-payment")
async def verify_mock_payment(
    payload: VerifyPaymentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Simulates verifying a payment and crediting the wallet."""
    
    user = await db.get(User, current.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    amount_decimal = Decimal(str(payload.amount))
    user.balance += amount_decimal

    txn = Transaction(
        transaction_id=uuid.uuid4(),
        user_id=user.user_id,
        amount=amount_decimal,
        type="TOPUP",
        balance_after=user.balance,
        notes=f"Razorpay Mock | ID: {payload.payment_id}" # UPDATED to look authentic
    )
    db.add(txn)
    
    # Unblock card if they paid off negative debt
    if user.balance >= Decimal("0.00"):
        await db.execute(
            update(RFIDCard).where(RFIDCard.user_id == user.user_id).values(is_blocked=False)
        )

    # Add notification
    db.add(Notification(
        user_id=user.user_id,
        title="Wallet Top Up Successful",
        body=f"₹{payload.amount} has been added to your wallet via UPI/Card.",
        type="info"
    ))

    await db.commit()
    await db.refresh(txn)
    
    return {"status": "success", "new_balance": float(user.balance)}