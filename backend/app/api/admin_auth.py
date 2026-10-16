from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_super_admin
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
    verify_refresh_token,
)
from app.db.session import get_db
from app.models import Admin, RefreshToken
from app.schemas.admin_auth import (
    AdminCreateRequest,
    AdminLoginRequest,
    AdminResponse,
)
from app.schemas.auth import MessageResponse, RefreshRequest, TokenResponse


router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


async def _issue_admin_tokens(db: AsyncSession, admin: Admin) -> TokenResponse:
    access = create_access_token(
        subject_id=str(admin.admin_id),
        subject_type="admin",
        role=admin.role,
    )
    refresh_plain = generate_refresh_token()
    token = RefreshToken(
        subject_id=admin.admin_id,
        subject_type="admin",
        token_hash=hash_refresh_token(refresh_plain),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(token)
    await db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh_plain)


@router.post("/login", response_model=TokenResponse)
async def admin_login(
    payload: AdminLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    admin = (
        await db.execute(select(Admin).where(Admin.email == payload.email))
    ).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return await _issue_admin_tokens(db, admin)


@router.post("/refresh", response_model=TokenResponse)
async def admin_refresh(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.subject_type == "admin",
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    for token in result.scalars().all():
        if verify_refresh_token(payload.refresh_token, token.token_hash):
            token.revoked = True
            await db.commit()
            admin = (
                await db.execute(
                    select(Admin).where(Admin.admin_id == token.subject_id)
                )
            ).scalar_one_or_none()
            if not admin or not admin.is_active:
                raise HTTPException(status_code=401, detail="Admin not found")
            return await _issue_admin_tokens(db, admin)

    raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout", response_model=MessageResponse)
async def admin_logout(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.subject_type == "admin",
            RefreshToken.revoked.is_(False),
        )
    )
    for token in result.scalars().all():
        if verify_refresh_token(payload.refresh_token, token.token_hash):
            token.revoked = True
            await db.commit()
            break
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=AdminResponse)
async def admin_me(admin: Annotated[Admin, Depends(get_current_admin)]):
    return admin


@router.post("/create-admin", response_model=AdminResponse)
async def create_admin(
    payload: AdminCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[Admin, Depends(get_current_super_admin)],
):
    if payload.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = (
        await db.execute(select(Admin).where(Admin.email == payload.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    admin = Admin(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        created_by=current.admin_id,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin