from datetime import datetime

from pydantic import BaseModel


class KPICard(BaseModel):
    label: str
    value: str
    delta: float | None = None
    hint: str | None = None


class OverviewResponse(BaseModel):
    revenue_today: float
    revenue_yesterday: float
    revenue_delta_pct: float
    
    journeys_today: int
    journeys_yesterday: int
    journeys_delta_pct: float
    
    active_buses: int
    total_buses: int
    active_trips: int
    
    devices_online: int
    devices_total: int
    
    # NEW METRICS
    total_users: int
    total_cards: int
    total_routes: int


class FleetBusItem(BaseModel):
    bus_id: str
    trip_id: str | None
    route_id: str | None
    latitude: float | None
    longitude: float | None
    speed_kmph: float | None
    recorded_at: datetime | None
    status: str  # "online" | "offline" | "idle"


class JourneyAdminItem(BaseModel):
    journey_id: str
    user_email: str | None
    rfid_id: str
    bus_id: str
    trip_id: str
    route_id: str
    route_name: str | None
    boarding_stop_name: str | None
    latest_exit_stop_name: str | None
    total_fare: float
    amount_collected: float
    outstanding_amount: float
    financial_state: str
    journey_state: str
    started_at: datetime
    ended_at: datetime | None


class RevenueByRoute(BaseModel):
    route_id: str
    route_name: str
    revenue: float
    journeys: int


class RevenueResponse(BaseModel):
    total_revenue: float
    total_transactions: int
    average_fare: float
    by_route: list[RevenueByRoute]


class DeviceHealthItem(BaseModel):
    device_id: str
    bus_id: str | None
    last_seen_at: datetime | None
    gps_ok: bool | None
    rfid_ok: bool | None
    network_ok: bool | None
    app_version: str | None
    minutes_since_seen: int | None
    status: str  # "online" | "stale" | "offline"