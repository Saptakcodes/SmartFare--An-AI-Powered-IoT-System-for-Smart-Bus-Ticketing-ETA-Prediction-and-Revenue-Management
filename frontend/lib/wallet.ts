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