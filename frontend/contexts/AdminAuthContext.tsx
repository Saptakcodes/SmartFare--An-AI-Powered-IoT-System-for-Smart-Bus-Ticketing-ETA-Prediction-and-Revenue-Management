import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "../lib/api";

const ADMIN_ACCESS_KEY = "smartfare.admin.access";
const ADMIN_REFRESH_KEY = "smartfare.admin.refresh";

export interface Admin {
  admin_id: string;
  email: string;
  full_name: string;
  role: "admin" | "super_admin";
  is_active: boolean;
}

interface AdminAuthValue {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(ADMIN_ACCESS_KEY);
      if (!token) {
        setAdmin(null);
        return;
      }
      const me = await apiRequest<Admin>("/admin/auth/me", {
        auth: false,
        headers: { Authorization: `Bearer ${token}` } as any,
      });
      setAdmin(me);
    } catch {
      await AsyncStorage.multiRemove([ADMIN_ACCESS_KEY, ADMIN_REFRESH_KEY]);
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshAdmin();
      setLoading(false);
    })();
  }, [refreshAdmin]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiRequest<{
        access_token: string;
        refresh_token: string;
      }>("/admin/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await AsyncStorage.multiSet([
        [ADMIN_ACCESS_KEY, tokens.access_token],
        [ADMIN_REFRESH_KEY, tokens.refresh_token],
      ]);
      await refreshAdmin();
    },
    [refreshAdmin]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([ADMIN_ACCESS_KEY, ADMIN_REFRESH_KEY]);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, signIn, signOut, refreshAdmin }),
    [admin, loading, signIn, signOut, refreshAdmin]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}