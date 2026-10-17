import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiRequest } from "./api";

const ADMIN_ACCESS_KEY = "smartfare.admin.access";

async function adminRequest<T>(path: string, options: any = {}): Promise<T> {
  const token = await AsyncStorage.getItem(ADMIN_ACCESS_KEY);
  return apiRequest<T>(path, {
    ...options,
    auth: false,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export interface Overview {
  revenue_today: number;
  revenue_yesterday: number;
  revenue_delta_pct: number;
  journeys_today: number;
  journeys_yesterday: number;
  journeys_delta_pct: number;
  active_buses: number;
  total_buses: number;
  active_trips: number;
  devices_online: number;
  devices_total: number;
  total_users: number;
  total_cards: number;
  total_routes: number;
}

// Update the function to accept days
export function getOverview(days: number = 1): Promise<Overview> {
  return adminRequest<Overview>(`/admin/dashboard/overview?days=${days}`);
}

export interface FleetBus {
  bus_id: string;
  trip_id: string | null;
  route_id: string | null;
  latitude: number | null;
  longitude: number | null;
  speed_kmph: number | null;
  recorded_at: string | null;
  status: "online" | "offline" | "idle";
}

export function getFleet(): Promise<FleetBus[]> {
  return adminRequest<FleetBus[]>("/admin/dashboard/fleet");
}

export interface AdminJourney {
  journey_id: string;
  user_email: string | null;
  rfid_id: string;
  bus_id: string;
  trip_id: string;
  route_id: string;
  route_name: string | null;
  boarding_stop_name: string | null;
  latest_exit_stop_name: string | null;
  total_fare: number;
  amount_collected: number;
  outstanding_amount: number;
  financial_state: string;
  journey_state: string;
  started_at: string;
  ended_at: string | null;
}

export function getAdminJourneys(limit = 100): Promise<AdminJourney[]> {
  return adminRequest<AdminJourney[]>(`/admin/dashboard/journeys?limit=${limit}`);
}

export interface RevenueByRoute {
  route_id: string;
  route_name: string;
  revenue: number;
  journeys: number;
}

export interface Revenue {
  total_revenue: number;
  total_transactions: number;
  average_fare: number;
  by_route: RevenueByRoute[];
}

export function getRevenue(days = 30): Promise<Revenue> {
  return adminRequest<Revenue>(`/admin/dashboard/revenue?days=${days}`);
}

export interface DeviceHealth {
  device_id: string;
  bus_id: string | null;
  last_seen_at: string | null;
  gps_ok: boolean | null;
  rfid_ok: boolean | null;
  network_ok: boolean | null;
  app_version: string | null;
  minutes_since_seen: number | null;
  status: "online" | "stale" | "offline";
}

export function getDevices(): Promise<DeviceHealth[]> {
  return adminRequest<DeviceHealth[]>("/admin/dashboard/devices");
}

export function validateTicket(qr_token: string, trip_id: string): Promise<{ status: string, message: string, journey_id: string }> {
  return adminRequest("/tickets/validate", {
    method: "POST",
    body: { qr_token, trip_id },
  });
}