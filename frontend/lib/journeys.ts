import { apiRequest } from "./api";

export interface Journey {
  journey_id: string;
  trip_id: string;
  bus_id: string;
  route_id: string;
  route_name: string | null;
  boarding_stop_id: string | null;
  boarding_stop_name: string | null;
  latest_exit_stop_id: string | null;
  latest_exit_stop_name: string | null;
  total_fare: number;
  amount_collected: number;
  outstanding_amount: number;
  financial_state: string;
  journey_state: string;
  started_at: string;
  ended_at: string | null;
}

export function listMyJourneys(): Promise<Journey[]> {
  return apiRequest<Journey[]>("/journeys/me", { auth: true });
}