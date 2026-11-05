import { apiRequest } from "./api";

export interface LiveBus {
  bus_id: string;
  trip_id: string | null;
  latitude: number;
  longitude: number;
  speed_kmph: number | null;
  recorded_at: string | null;
  route_id: string | null;
  direction: string | null;
  trip_status: string | null;
}

export function fetchLiveBuses(minutes = 10): Promise<LiveBus[]> {
  return apiRequest<LiveBus[]>(`/buses/live?minutes=${minutes}`);
}

// --- NEWLY ADDED ETA FUNCTIONALITY ---

export interface BusETA {
  eta_minutes: number | null;
  status: "online" | "offline";
  message?: string;
}

export function getBusETA(bus_id: string, route_id: string, target_stop_id: string): Promise<BusETA> {
  return apiRequest<BusETA>(`/buses/${bus_id}/eta?route_id=${route_id}&target_stop_id=${target_stop_id}`);
}