import { apiRequest } from "./api";

export interface Stop {
  stop_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteSearchResult {
  route_id: string;
  name: string;
  source_stop_id: string;
  source_stop_name: string;
  destination_stop_id: string;
  destination_stop_name: string;
  stops_count: number;
}

export interface RouteStopItem {
  stop_id: string;
  name: string;
  seq: number;
  latitude: number;
  longitude: number;
}

export interface RouteDetail {
  route_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  stops: RouteStopItem[];
}

export function searchStops(q: string): Promise<Stop[]> {
  const query = q ? `?q=${encodeURIComponent(q)}&limit=20` : "?limit=50";
  return apiRequest<Stop[]>(`/stops${query}`);
}

export function nearbyStops(
  lat: number,
  lon: number,
  radius_m = 1500
): Promise<Stop[]> {
  return apiRequest<Stop[]>(
    `/stops/nearby?lat=${lat}&lon=${lon}&radius_m=${radius_m}`
  );
}

export function searchRoutes(
  sourceStopId: string,
  destinationStopId: string
): Promise<RouteSearchResult[]> {
  return apiRequest<RouteSearchResult[]>(
    `/routes/search?source_stop_id=${encodeURIComponent(
      sourceStopId
    )}&destination_stop_id=${encodeURIComponent(destinationStopId)}`
  );
}

export function getRouteDetail(routeId: string): Promise<RouteDetail> {
  return apiRequest<RouteDetail>(`/routes/${routeId}`);
}