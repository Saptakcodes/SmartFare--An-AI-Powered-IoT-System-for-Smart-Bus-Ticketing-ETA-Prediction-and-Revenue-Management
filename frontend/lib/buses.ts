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