import { Redirect, Stack, usePathname } from "expo-router";
import {
  Activity,
  BarChart3,
  Bus,
  LayoutDashboard,
  LogOut,
  Route as RouteIcon,
  Settings,
  Ticket,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminTopBar } from "../../components/admin/AdminTopBar";
import { Logo } from "../../components/ui/Logo";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useLayout } from "../../lib/useLayout";
import { useTheme } from "../../theme/ThemeProvider";
import { ThemeColors, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

const NAV = [
  {
    section: "Operations",
    items: [
      { label: "Overview", href: "/admin", Icon: LayoutDashboard, title: "Overview" },
      { label: "Fleet", href: "/admin/fleet", Icon: Bus, title: "Live Fleet" },
      { label: "Journeys", href: "/admin/journeys", Icon: Ticket, title: "Journeys" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { label: "Revenue", href: "/admin/revenue", Icon: BarChart3, title: "Revenue" },
      { label: "Devices", href: "/admin/devices", Icon: Activity, title: "Devices" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings", href: "/admin/settings", Icon: Settings, title: "Settings" },
    ],
  },
];

export default function AdminLayout() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { admin, loading, signOut } = useAdminAuth();
  const { isDesktop } = useLayout();

  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Loading…
        </Text>
      </View>
    );
  }

  if (!admin) {
    return <Redirect href="/admin/login" />;
  }

  // Determine current page title for topbar
  const flat = NAV.flatMap((g) => g.items);
  const current = flat.find((item) =>
    item.href === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(item.href)
  );
  const pageTitle = current?.title ?? "Admin";

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Sidebar
        colors={colors}
        onSignOut={signOut}
        adminEmail={admin.email}
      />
      <View style={styles.contentCol}>
        <AdminTopBar title={pageTitle} adminEmail={admin.email} />
        <View style={styles.stackWrap}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </View>
  );
}

function Sidebar({
  colors,
  onSignOut,
  adminEmail,
}: {
  colors: ThemeColors;
  onSignOut: () => Promise<void>;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const { useRouter } = require("expo-router");
  const router = useRouter();

  const initials = adminEmail.split("@")[0].slice(0, 2).toUpperCase();

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
      {/* Brand */}
      <View style={styles.brandBlock}>
        <Logo size="sm" />
        <Text
          style={[
            typography.tiny,
            { color: colors.textMuted, marginTop: spacing.sm },
          ]}
        >
          ADMIN CONSOLE
        </Text>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV.map((group) => (
          <View key={group.section} style={styles.navGroup}>
            <Text
              style={[
                typography.tiny,
                {
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
            >
              {group.section}
            </Text>
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin" || pathname === "/admin/"
                  : pathname.startsWith(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={[
                    styles.navItem,
                    active && { backgroundColor: colors.primary + "14" },
                  ]}
                >
                  {active ? (
                    <View
                      style={[
                        styles.activeBar,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                  ) : null}
                  <item.Icon
                    color={active ? colors.accent : colors.textMuted}
                    size={17}
                  />
                  <Text
                    style={[
                      typography.bodySm,
                      {
                        color: active ? colors.textPrimary : colors.textSecondary,
                        marginLeft: spacing.md,
                        fontWeight: active ? "600" : "500",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.bg,
          },
        ]}
      >
        <View
          style={[
            styles.footerAvatar,
            { backgroundColor: colors.primary + "22" },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: colors.primary, fontWeight: "700" },
            ]}
          >
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[
              typography.caption,
              { color: colors.textPrimary, fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
            {adminEmail.split("@")[0]}
          </Text>
          <Text
            style={[typography.micro, { color: colors.textMuted, marginTop: 1 }]}
            numberOfLines={1}
          >
            {adminEmail}
          </Text>
        </View>
        <Pressable onPress={onSignOut} hitSlop={8}>
          <LogOut color={colors.textMuted} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  contentCol: { flex: 1 },
  stackWrap: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  sidebar: {
    width: 244,
    borderRightWidth: 1,
  },
  brandBlock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  nav: { paddingHorizontal: spacing.md, gap: spacing.xl },
  navGroup: { gap: spacing.xs },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    position: "relative",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  spacer: { flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});