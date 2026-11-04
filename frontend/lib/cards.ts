import { apiRequest } from "./api";

export interface RFIDCard {
  rfid_id: string;
  is_blocked: boolean;
  issued_at: string;
}

export function listCards(): Promise<RFIDCard[]> {
  return apiRequest<RFIDCard[]>("/rfid/me", { auth: true });
}

export function linkCard(rfid_id: string): Promise<RFIDCard> {
  return apiRequest<RFIDCard>("/rfid/link", {
    method: "POST",
    body: { rfid_id },
    auth: true,
  });
}

export function unlinkCard(rfid_id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/rfid/${rfid_id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function updateCardStatus(rfid_id: string, is_blocked: boolean): Promise<RFIDCard> {
  return apiRequest<RFIDCard>(`/rfid/${rfid_id}/status`, {
    method: "PATCH",
    body: { is_blocked },
    auth: true,
  });
}