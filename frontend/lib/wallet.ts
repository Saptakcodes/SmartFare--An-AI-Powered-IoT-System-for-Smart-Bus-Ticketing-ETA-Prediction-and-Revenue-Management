import { apiRequest } from "./api";

export interface Transaction {
  transaction_id: string;
  journey_id: string | null;
  amount: number;
  type: "TOPUP" | "FARE_ENTRY" | "FARE_UPDATE" | "FARE_FINAL" | "REFUND";
  balance_after: number | null;
  notes: string | null;
  created_at: string;
}

export interface TopUpResponse {
  balance: number;
  transaction_id: string;
}

export function listTransactions(): Promise<Transaction[]> {
  return apiRequest<Transaction[]>("/transactions/me", { auth: true });
}

export function topUp(amount: number): Promise<TopUpResponse> {
  return apiRequest<TopUpResponse>("/wallet/topup", {
    method: "POST",
    body: { amount },
    auth: true,
  });
}

// --- ADDED MOCK PAYMENT FUNCTIONS ---

export interface MockOrder {
  id: string;
  amount: number; // In paise
  currency: string;
  status: string;
}

export function createMockOrder(amount_in_rupees: number): Promise<MockOrder> {
  return apiRequest<MockOrder>("/mock-payment/create-order", {
    method: "POST",
    body: { amount: amount_in_rupees },
    auth: true,
  });
}

export function verifyMockPayment(order_id: string, amount_in_rupees: number): Promise<{ status: string, new_balance: number }> {
  return apiRequest("/mock-payment/verify-payment", {
    method: "POST",
    body: { order_id, amount: amount_in_rupees },
    auth: true,
  });
}