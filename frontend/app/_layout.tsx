import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdminAuthProvider } from "../contexts/AdminAuthContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

function AppShell() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <AppShell />
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}