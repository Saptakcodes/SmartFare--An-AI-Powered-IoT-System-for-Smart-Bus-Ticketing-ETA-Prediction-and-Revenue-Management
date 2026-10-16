from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


EventType = Literal[
    "RFID_EVENT",
    "GPS_UPDATE",
    "JOURNEY_START",
    "JOURNEY_UPDATE",
    "JOURNEY_END",
    "TRANSACTION",
]


class RFIDEventIn(BaseModel):
    event_id: str
    device_id: str
    epc: str
    bus_id: str
    trip_id: str | None = None
    event_type: Literal["ENTRY", "POSSIBLE_EXIT", "UNKNOWN"]
    stop_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    speed_kmph: float | None = None
    gps_utc_time: str | None = None
    gps_date: str | None = None
    session_started_at: datetime
    session_ended_at: datetime | None = None
    detected_at: datetime


class GPSUpdateIn(BaseModel):
    gps_id: str
    device_id: str
    bus_id: str
    trip_id: str
    latitude: float
    longitude: float
    speed_kmph: float | None = None
    gps_utc_time: str | None = None
    gps_date: str | None = None
    recorded_at: datetime


class TransactionIn(BaseModel):
    transaction_id: str
    journey_id: str
    user_id: str
    amount: float
    type: Literal["FARE_ENTRY", "FARE_UPDATE", "FARE_FINAL", "REFUND", "TOPUP"]
    balance_after: float | None = None
    notes: str | None = None
    created_at: datetime


class EventEnvelope(BaseModel):
    event_id: str
    event_type: EventType
    payload: dict


class SyncBatchIn(BaseModel):
    device_id: str
    bus_id: str
    events: list[EventEnvelope]


class SyncEventResult(BaseModel):
    event_id: str
    status: Literal["OK", "DUPLICATE", "ERROR"]
    error: str | None = None


class SyncBatchOut(BaseModel):
    received: int
    ok: int
    duplicates: int
    errors: int
    results: list[SyncEventResult]


class TripStartIn(BaseModel):
    device_id: str
    bus_id: str
    route_id: str
    direction: str | None = None


class TripStartOut(BaseModel):
    trip_id: str


class TripEndIn(BaseModel):
    device_id: str
    trip_id: str
    ended_at: datetime | None = None


class StopCacheItem(BaseModel):
    stop_id: str
    name: str
    seq: int
    latitude: float
    longitude: float


class FareCacheItem(BaseModel):
    from_stop_id: str
    to_stop_id: str
    amount: float


class RFIDCacheItem(BaseModel):
    epc: str
    rfid_id: str
    user_id: str
    is_blocked: bool


class RFIDCacheOut(BaseModel):
    generated_at: datetime
    items: list[RFIDCacheItem]


class DeviceHeartbeatIn(BaseModel):
    device_id: str
    bus_id: str | None = None
    gps_ok: bool | None = None
    rfid_ok: bool | None = None
    network_ok: bool | None = None
    app_version: str | None = None
    metadata: dict | None = None