from typing import Annotated

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_device_key(
    x_device_key: Annotated[str | None, Header()] = None,
) -> str:
    """
    Validates the X-Device-Key header.
    Used to authenticate Raspberry Pi devices.
    """
    if not settings.DEVICE_API_KEY:
        return "dev"

    if not x_device_key or x_device_key != settings.DEVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing device key",
        )
    return x_device_key