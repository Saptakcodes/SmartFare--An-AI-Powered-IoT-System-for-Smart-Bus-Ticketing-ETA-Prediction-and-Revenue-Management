import { apiRequest } from "./api";

export interface DigitalTicket {
  ticket_id: string;
  qr_token: string;
  amount_paid: number;
  expires_at: string;
}

export function buyTicket(route_id: string, from_stop_id: string, to_stop_id: string): Promise<DigitalTicket> {
  return apiRequest<DigitalTicket>("/tickets/buy", {
    method: "POST",
    body: { route_id, from_stop_id, to_stop_id },
    auth: true,
  });
}

export interface DigitalTicketRecord {
  ticket_id: string;
  qr_token: string;
  amount_paid: number;
  status: string;
  created_at: string;
  expires_at: string;
}

export function listMyTickets(): Promise<DigitalTicketRecord[]> {
  return apiRequest<DigitalTicketRecord[]>("/tickets/me", { auth: true });
}