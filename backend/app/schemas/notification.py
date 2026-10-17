import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True