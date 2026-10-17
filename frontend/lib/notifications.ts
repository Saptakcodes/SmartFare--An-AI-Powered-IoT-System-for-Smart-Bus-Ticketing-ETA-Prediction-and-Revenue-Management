import { apiRequest } from "./api";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function listNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications/me", { auth: true });
}

export function markAllNotificationsRead(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>("/notifications/me/read-all", {
    method: "POST",
    auth: true,
  });
}