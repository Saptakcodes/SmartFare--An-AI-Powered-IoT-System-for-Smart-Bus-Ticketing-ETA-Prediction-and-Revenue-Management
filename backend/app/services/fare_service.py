"""
Deterministic fare settlement.

Rule (from architecture):
    Additional Charge = New Total Fare - Amount Already Collected

The journey is charged incrementally:
- ENTRY: no charge yet (boarding stop set)
- POSSIBLE_EXIT at stop X: look up fare(boarding, X)
    - if greater than what was already collected → charge difference
    - if same or less → no extra charge
- Insufficient balance → journey stays PARTIAL, no transaction created
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Fare, Journey, Transaction, User


async def lookup_fare(
    db: AsyncSession,
    route_id: str,
    from_stop_id: str,
    to_stop_id: str,
) -> Decimal | None:
    result = await db.execute(
        select(Fare.amount).where(
            Fare.route_id == route_id,
            Fare.from_stop_id == from_stop_id,
            Fare.to_stop_id == to_stop_id,
        )
    )
    amount = result.scalar_one_or_none()
    return Decimal(amount) if amount is not None else None


async def settle_possible_exit(
    db: AsyncSession,
    journey: Journey,
    new_exit_stop_id: str,
) -> dict:
    """
    Progressively settle fare when a new possible-exit is detected.

    Returns a summary dict for logging/response.
    """
    if not journey.boarding_stop_id:
        return {"status": "NO_BOARDING_STOP", "additional": 0.0}

    if journey.latest_exit_stop_id == new_exit_stop_id:
        return {"status": "SAME_EXIT", "additional": 0.0}

    new_total = await lookup_fare(
        db,
        journey.route_id,
        journey.boarding_stop_id,
        new_exit_stop_id,
    )
    if new_total is None:
        return {"status": "NO_FARE_RECORD", "additional": 0.0}

    new_total = Decimal(new_total)
    already = Decimal(journey.amount_collected or 0)
    additional = new_total - already

    if additional <= 0:
        # Already charged at least this much; just update exit location
        journey.latest_exit_stop_id = new_exit_stop_id
        await db.commit()
        return {"status": "NO_ADDITIONAL", "additional": 0.0}

    user = (
        await db.execute(select(User).where(User.user_id == journey.user_id))
    ).scalar_one_or_none()
    if not user:
        return {"status": "USER_NOT_FOUND", "additional": 0.0}

    user_balance = Decimal(user.balance or 0)

    if user_balance < additional:
        # Reject additional charge; journey stays partial
        journey.latest_exit_stop_id = new_exit_stop_id
        journey.total_fare = new_total
        journey.outstanding_amount = new_total - already
        journey.financial_state = "PARTIAL"
        await db.commit()
        return {
            "status": "INSUFFICIENT_BALANCE",
            "additional": float(additional),
            "balance": float(user_balance),
        }

    # Deduct
    user.balance = user_balance - additional
    journey.amount_collected = already + additional
    journey.total_fare = new_total
    journey.latest_exit_stop_id = new_exit_stop_id
    journey.latest_exit_at = journey.latest_exit_at  # set by caller
    journey.outstanding_amount = new_total - (already + additional)
    journey.financial_state = (
        "SETTLED" if journey.outstanding_amount == 0 else "PARTIAL"
    )

    txn = Transaction(
        journey_id=journey.journey_id,
        user_id=user.user_id,
        amount=additional,
        type="FARE_UPDATE",
        balance_after=user.balance,
        notes=f"Fare update to stop {new_exit_stop_id}",
    )
    db.add(txn)
    await db.commit()

    return {
        "status": "CHARGED",
        "additional": float(additional),
        "new_total": float(new_total),
        "balance_after": float(user.balance),
    }


async def finalize_journey(
    db: AsyncSession,
    journey: Journey,
) -> dict:
    """
    Called when the trip ends.
    If there is an outstanding amount, mark for reconciliation.
    """
    if journey.outstanding_amount and Decimal(journey.outstanding_amount) > 0:
        journey.financial_state = "PARTIAL"
    else:
        journey.financial_state = "SETTLED"
    journey.journey_state = "RECONCILED"
    await db.commit()
    return {"status": "FINALIZED"}