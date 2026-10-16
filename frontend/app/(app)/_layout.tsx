import { Tabs } from "expo-router";
import { Home, MapPin, Search, User, Wallet } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "../../components/ui/Logo";
import { useLayout } from "../../lib/useLayout";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

function DesktopSidebar() {
  const { colors } = useTheme();
  const { useRouter, usePathname } = require("expo-router");
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { label: "Home", Icon: Home, href: "/home" },
    { label: "Search", Icon: Search, href: "/search" },
    { label: "Live Map", Icon: MapPin, href: "/map" },
    { label: "Wallet", Icon: Wallet, href: "/wallet" },
    { label: "Profile", Icon: User, href: "/profile" },
  ];

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
        },
      ]}
    >
      <View style={styles.sidebarHeader}>
        <Logo size="sm" />
      </View>
      <View style={styles.sidebarNav}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={[
                styles.sidebarItem,
                active && { backgroundColor: colors.primary + "18" },
              ]}
            >
              <item.Icon
                color={active ? colors.accent : colors.textSecondary}
                size={20}
              />
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: active ? colors.textPrimary : colors.textSecondary,
                    marginLeft: spacing.md,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: colors.bg }]}>
        <DesktopSidebar />
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen name="home" options={{ title: "Home" }} />
            <Tabs.Screen name="search" options={{ title: "Search" }} />
            <Tabs.Screen name="map" options={{ title: "Map" }} />
            <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Search color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <MapPin color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <Wallet color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={22} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopRoot: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    paddingTop: spacing.xxl,
  },
  sidebarHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sidebarNav: { paddingHorizontal: spacing.md, gap: spacing.xs },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  desktopContent: { flex: 1 },
});