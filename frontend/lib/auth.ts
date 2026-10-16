import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  apiRequest,
} from "./api";
import type { MessageResponse, TokenResponse, User } from "./types";

export async function saveTokens(tokens: TokenResponse): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, tokens.access_token],
    [REFRESH_TOKEN_KEY, tokens.refresh_token],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function hasTokens(): Promise<boolean> {
  const t = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return t !== null;
}

export function register(
  email: string,
  full_name: string,
  password: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/register", {
    method: "POST",
    body: { email, full_name, password },
  });
}

export function verifyOtp(
  email: string,
  otp: string
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export function resendOtp(email: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function me(): Promise<User> {
  return apiRequest<User>("/auth/me", { auth: true });
}

export async function logout(): Promise<void> {
  const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  try {
    if (refresh) {
      await apiRequest<MessageResponse>("/auth/logout", {
        method: "POST",
        body: { refresh_token: refresh },
        auth: true,
      });
    }
  } catch {
    // ignore — we're clearing locally anyway
  }
  await clearTokens();
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(
  email: string,
  otp: string,
  new_password: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: { email, otp, new_password },
  });
}