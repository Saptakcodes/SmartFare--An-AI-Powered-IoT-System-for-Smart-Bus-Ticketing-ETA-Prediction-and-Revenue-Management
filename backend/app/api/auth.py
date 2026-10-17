from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Notification
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.session import get_db
from app.models import RefreshToken, User
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendOTPRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.otp_service import (
    OTP_RESEND_COOLDOWN_SECONDS,
    create_and_send_otp,
    get_latest_otp,
    verify_otp_record,
)


router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(
    db: AsyncSession,
    user: User,
) -> TokenResponse:
    access = create_access_token(
        subject_id=str(user.user_id),
        subject_type="user",
        role="passenger",
    )
    refresh_plain = generate_refresh_token()
    refresh = RefreshToken(
        subject_id=user.user_id,
        subject_type="user",
        token_hash=hash_refresh_token(refresh_plain),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh)
    await db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh_plain)


@router.post("/register", response_model=MessageResponse)
async def register(
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await create_and_send_otp(
        db, identifier=payload.email, purpose="registration", user_id=user.user_id
    )
    return MessageResponse(message="OTP sent to your email")


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(
    payload: VerifyOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    record = await get_latest_otp(db, payload.email, "registration")
    if not record:
        raise HTTPException(status_code=400, detail="No active OTP. Request a new one")

    try:
        await verify_otp_record(db, record, payload.otp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user.is_verified = True
    db.add(Notification(
    user_id=user.user_id,
    title="Welcome to SmartFare",
    body="Your account is verified. Link your RFID card to start riding.",
    type="info"
))
    await db.commit()
    await db.refresh(user)

    return await _issue_tokens(db, user)


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    payload: ResendOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    latest = await get_latest_otp(db, payload.email, "registration")
    if latest:
        elapsed = (datetime.now(timezone.utc) - latest.created_at).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait} seconds before requesting another OTP",
            )

    await create_and_send_otp(
        db, identifier=payload.email, purpose="registration", user_id=user.user_id
    )
    return MessageResponse(message="OTP resent")


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    return await _issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Find candidate refresh tokens (by scanning — bcrypt can't be looked up by hash)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.subject_type == "user",
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    candidates = result.scalars().all()

    from app.core.security import verify_refresh_token

    match = None
    for token in candidates:
        if verify_refresh_token(payload.refresh_token, token.token_hash):
            match = token
            break

    if not match:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Rotate: revoke old, issue new
    match.revoked = True
    await db.commit()

    user = (
        await db.execute(select(User).where(User.user_id == match.subject_id))
    ).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    return await _issue_tokens(db, user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.subject_type == "user",
            RefreshToken.revoked.is_(False),
        )
    )
    from app.core.security import verify_refresh_token

    for token in result.scalars().all():
        if verify_refresh_token(payload.refresh_token, token.token_hash):
            token.revoked = True
            await db.commit()
            return MessageResponse(message="Logged out")

    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserResponse)
async def me(user: Annotated[User, Depends(get_current_user)]):
    return user


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()

    # Always return the same message to prevent email enumeration
    generic_message = MessageResponse(
        message="If an account exists with this email, a reset code has been sent"
    )

    if not user:
        return generic_message

    if not user.is_active:
        return generic_message

    # Rate-limit: prevent spamming the same email
    latest = await get_latest_otp(db, payload.email, "password_reset")
    if latest:
        elapsed = (datetime.now(timezone.utc) - latest.created_at).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait} seconds before requesting another code",
            )

    await create_and_send_otp(
        db,
        identifier=payload.email,
        purpose="password_reset",
        user_id=user.user_id,
    )
    return generic_message


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = await get_latest_otp(db, payload.email, "password_reset")
    if not record:
        raise HTTPException(
            status_code=400, detail="No active reset code. Request a new one"
        )

    try:
        await verify_otp_record(db, record, payload.otp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update password
    user.password_hash = hash_password(payload.new_password)
    await db.commit()

    # Revoke all refresh tokens for this user — force re-login everywhere
    from sqlalchemy import update as sa_update

    await db.execute(
        sa_update(RefreshToken)
        .where(
            RefreshToken.subject_id == user.user_id,
            RefreshToken.subject_type == "user",
            RefreshToken.revoked.is_(False),
        )
        .values(revoked=True)
    )
    await db.commit()

    return MessageResponse(
        message="Password updated successfully. Please log in again."
    )