import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RouteListItem(BaseModel):
    route_id: str
    name: str
    description: str | None
    stops_count: int
    is_active: bool


class StopListItem(BaseModel):
    stop_id: str
    name: str
    latitude: float
    longitude: float


class RouteStopItem(BaseModel):
    stop_id: str
    name: str
    seq: int
    latitude: float
    longitude: float


class RouteDetail(BaseModel):
    route_id: str
    name: str
    description: str | None
    is_active: bool
    stops: list[RouteStopItem]


class RouteSearchResult(BaseModel):
    route_id: str
    name: str
    source_stop_id: str
    source_stop_name: str
    destination_stop_id: str
    destination_stop_name: str
    stops_count: int


class JourneyListItem(BaseModel):
    journey_id: uuid.UUID
    trip_id: str
    bus_id: str
    route_id: str
    route_name: str | None
    boarding_stop_id: str | None
    boarding_stop_name: str | None
    latest_exit_stop_id: str | None
    latest_exit_stop_name: str | None
    total_fare: float
    amount_collected: float
    outstanding_amount: float
    financial_state: str
    journey_state: str
    started_at: datetime
    ended_at: datetime | None


class TransactionListItem(BaseModel):
    transaction_id: uuid.UUID
    journey_id: uuid.UUID | None
    amount: float
    type: str
    balance_after: float | None
    notes: str | None
    created_at: datetime


class RFIDCardItem(BaseModel):
    rfid_id: str
    is_blocked: bool
    issued_at: datetime


class LinkRFIDRequest(BaseModel):
    rfid_id: str

class TopUpRequest(BaseModel):
    amount: float


class TopUpResponse(BaseModel):
    balance: float
    transaction_id: uuid.UUID