import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  CreditCard,
  History,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimatedBlobs } from "../../components/ui/AnimatedBlobs";
import { Card } from "../../components/ui/Card";
import { CountUp } from "../../components/ui/CountUp";
import { Logo } from "../../components/ui/Logo";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
}

function getFirstName(user: {
  full_name?: string | null;
  email: string;
}): string {
  if (user.full_name) {
    return user.full_name.split(" ")[0];
  }
  return user.email.split("@")[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [greeting, setGreeting] = useState(getGreeting());

  // Refresh greeting every minute in case user keeps screen open
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  const actions = [
    {
      icon: <MapPin color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "Track bus",
      hint: "Live map",
      onPress: () => router.push("/map"),
    },
    {
      icon: <CreditCard color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "My card",
      hint: "Tap & go",
      onPress: () => router.push("/card"),
    },
    {
      icon: <WalletIcon color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "Top up",
      hint: "Add money",
      onPress: () => router.push("/wallet"),
    },
    {
      icon: <History color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "History",
      hint: "Past trips",
      onPress: () => router.push("/journeys"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AnimatedBlobs />
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Logo size="sm" />
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/notifications")}
              hitSlop={10}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Bell color={colors.textSecondary} size={18} />
              <View
                style={[styles.bellDot, { backgroundColor: colors.accent }]}
              />
            </Pressable>
            <Pressable
              onPress={onSignOut}
              hitSlop={10}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <LogOut color={colors.textSecondary} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {greeting}
          </Text>
          <Text
            style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}
            numberOfLines={1}
          >
            {getFirstName(user)}
          </Text>
        </View>

        {/* Wallet card */}
        <Pressable
          onPress={() => router.push("/wallet")}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.985 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={colors.brandGradient as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.walletTop}>
              <View style={styles.walletTopLeft}>
                <WalletIcon color="#ffffffdd" size={18} />
                <Text
                  style={[
                    typography.caption,
                    { color: "#ffffffdd", marginLeft: spacing.sm },
                  ]}
                >
                  Wallet balance
                </Text>
              </View>
              <View
                style={[
                  styles.trendPill,
                  { backgroundColor: "rgba(255,255,255,0.18)" },
                ]}
              >
                <TrendingUp color="#fff" size={11} />
                <Text
                  style={[
                    typography.micro,
                    { color: "#fff", marginLeft: 4 },
                  ]}
                >
                  Active
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.display,
                { color: "#fff", marginTop: spacing.md },
              ]}
            >
              ₹ <CountUp value={Number(user.balance)} />
            </Text>

            <View style={styles.walletActions}>
              <Pressable
                style={styles.walletAction}
                onPress={() => router.push("/wallet")}
              >
                <PlusCircle color="#ffffffdd" size={15} />
                <Text
                  style={[
                    typography.caption,
                    { color: "#ffffffdd", marginLeft: 6, fontWeight: "600" },
                  ]}
                >
                  Top up
                </Text>
              </Pressable>
              <Pressable
                style={styles.walletAction}
                onPress={() => router.push("/journeys")}
              >
                <History color="#ffffffdd" size={15} />
                <Text
                  style={[
                    typography.caption,
                    { color: "#ffffffdd", marginLeft: 6, fontWeight: "600" },
                  ]}
                >
                  History
                </Text>
              </Pressable>
            </View>

            {/* Decorative circles */}
            <View style={styles.walletDeco1} />
            <View style={styles.walletDeco2} />
          </LinearGradient>
        </Pressable>

        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/search")}
          style={({ pressed }) => [
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
            elevation.sm,
          ]}
        >
          <Search color={colors.textMuted} size={18} />
          <Text
            style={[
              typography.body,
              { color: colors.textMuted, marginLeft: spacing.sm, flex: 1 },
            ]}
          >
            Where to?
          </Text>
          <ArrowRight color={colors.textMuted} size={16} />
        </Pressable>

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            Quick actions
          </Text>
          <Sparkles color={colors.accent} size={14} />
        </View>

        <View style={styles.grid}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
                elevation.sm,
              ]}
            >
              <View
                style={[
                  styles.tileIcon,
                  { backgroundColor: colors.accent + "14" },
                ]}
              >
                {a.icon}
              </View>
              <Text
                style={[
                  typography.bodySm,
                  {
                    color: colors.textPrimary,
                    marginTop: spacing.sm,
                    fontWeight: "600",
                    textAlign: "center",
                  },
                ]}
              >
                {a.label}
              </Text>
              <Text
                style={[
                  typography.micro,
                  { color: colors.textMuted, marginTop: 2 },
                ]}
              >
                {a.hint}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Account status */}
        <Card
          variant="accent"
          accentColor={user.is_verified ? colors.success : colors.warning}
          style={{ marginTop: spacing.xxl }}
        >
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                Account status
              </Text>
              <Text
                style={[
                  typography.h3,
                  { color: colors.textPrimary, marginTop: 3 },
                ]}
              >
                {user.is_verified ? "Verified" : "Unverified"}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: user.is_verified
                    ? colors.success + "22"
                    : colors.warning + "22",
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: user.is_verified
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: user.is_verified ? colors.success : colors.warning,
                    marginLeft: 6,
                    fontWeight: "600",
                  },
                ]}
              >
                {user.is_verified ? "Active" : "Pending"}
              </Text>
            </View>
          </View>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  greeting: { marginTop: spacing.xl },
  walletCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  walletTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletTopLeft: { flexDirection: "row", alignItems: "center" },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  walletActions: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
    zIndex: 2,
  },
  walletAction: { flexDirection: "row", alignItems: "center" },
  walletDeco1: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  walletDeco2: {
    position: "absolute",
    right: 40,
    bottom: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
    marginTop: spacing.lg,
  },
  tile: {
    width: "48%",
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});