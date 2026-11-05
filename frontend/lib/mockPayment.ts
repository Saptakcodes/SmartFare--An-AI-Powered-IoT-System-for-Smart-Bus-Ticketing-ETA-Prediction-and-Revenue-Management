import { apiRequest } from "./api";

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