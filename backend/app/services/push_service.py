import httpx
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User

logger = logging.getLogger("smartfare.push")

async def send_push_notification(user: User, title: str, body: str):
    if not user.expo_push_token:
        return # User hasn't registered their phone yet

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": user.expo_push_token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                }
            )
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")