from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    generate_otp,
    hash_otp,
    verify_otp as verify_otp_hash,
)
from app.models import OTPVerification
from app.services.email_service import send_otp_email


OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


async def create_and_send_otp(
    db: AsyncSession,
    identifier: str,
    purpose: str,
    user_id=None,
    identifier_type: str = "email",
) -> None:
    # Invalidate previous unused OTPs for this identifier + purpose
    await db.execute(
        update(OTPVerification)
        .where(
            OTPVerification.identifier == identifier,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used.is_(False),
        )
        .values(is_used=True)
    )

    otp = generate_otp()
    now = datetime.now(timezone.utc)

    record = OTPVerification(
        identifier=identifier,
        identifier_type=identifier_type,
        purpose=purpose,
        otp_hash=hash_otp(otp),
        user_id=user_id,
        expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
        max_attempts=OTP_MAX_ATTEMPTS,
        is_used=False,
    )
    db.add(record)
    await db.commit()

    send_otp_email(identifier, otp, purpose=purpose)


async def get_latest_otp(
    db: AsyncSession, identifier: str, purpose: str
) -> OTPVerification | None:
    result = await db.execute(
        select(OTPVerification)
        .where(
            OTPVerification.identifier == identifier,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used.is_(False),
        )
        .order_by(desc(OTPVerification.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def verify_otp_record(
    db: AsyncSession, record: OTPVerification, otp: str
) -> None:
    """Raises ValueError with reason if invalid."""
    now = datetime.now(timezone.utc)

    if record.expires_at < now:
        raise ValueError("OTP expired")

    if record.attempts >= record.max_attempts:
        raise ValueError("Maximum attempts exceeded")

    if not verify_otp_hash(otp, record.otp_hash):
        record.attempts += 1
        await db.commit()
        remaining = record.max_attempts - record.attempts
        raise ValueError(f"Invalid OTP. {remaining} attempts remaining")

    record.is_used = True
    await db.commit()