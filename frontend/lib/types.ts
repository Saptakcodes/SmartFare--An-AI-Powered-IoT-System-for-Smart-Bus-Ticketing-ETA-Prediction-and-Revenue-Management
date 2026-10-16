export interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  balance: number;
  is_verified: boolean;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface Stop {
  stop_id: string;
  name: string;
  seq: number;
  latitude: number;
  longitude: number;
}

export interface Fare {
  from_stop_id: string;
  to_stop_id: string;
  amount: number;
}