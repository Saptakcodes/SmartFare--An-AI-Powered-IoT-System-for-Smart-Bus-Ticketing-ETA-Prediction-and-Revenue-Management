import uuid
from pydantic import BaseModel

class BuyTicketRequest(BaseModel):
    route_id: str
    from_stop_id: str
    to_stop_id: str

class TicketResponse(BaseModel):
    ticket_id: str
    qr_token: str
    amount_paid: float
    expires_at: str

class ValidateTicketRequest(BaseModel):
    qr_token: str
    trip_id: str # Conductor passes the active trip ID