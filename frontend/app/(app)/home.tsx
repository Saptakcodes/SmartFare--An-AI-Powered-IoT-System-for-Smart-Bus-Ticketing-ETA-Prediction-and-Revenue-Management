import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CreditCard,
  History,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../../components/ui/Card";
import { Logo } from "../../components/ui/Logo";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();

  if (!user) return null;

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  const actions = [
    {
      icon: <MapPin color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "Track bus",
      onPress: () => router.push("/map"),
    },
    {
      icon: <CreditCard color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "My card",
      onPress: () => router.push("/card"),
    },
    {
      icon: <WalletIcon color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "Top up",
      onPress: () => router.push("/wallet"),
    },
    {
      icon: <History color={colors.accent} size={22} strokeWidth={1.9} />,
      label: "History",
      onPress: () => router.push("/journeys"),
    },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Logo size="sm" />
        <Pressable onPress={onSignOut} hitSlop={10}>
          <LogOut color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Good to see you
        </Text>
        <Text
          style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}
          numberOfLines={1}
        >
          {user.full_name || user.email.split("@")[0]}
        </Text>
      </View>

      {/* Wallet card */}
      <LinearGradient
        colors={colors.brandGradient as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <View style={styles.walletTop}>
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
        <Text
          style={[typography.display, { color: "#fff", marginTop: spacing.md }]}
        >
          ₹ {Number(user.balance).toFixed(2)}
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

        {/* subtle decoration */}
        <View style={styles.walletDeco1} />
        <View style={styles.walletDeco2} />
      </LinearGradient>

      {/* Search bar */}
      <Pressable
        onPress={() => router.push("/search")}
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
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

      {/* Quick actions grid — 2x2 centered */}
      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={[
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
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
          </Pressable>
        ))}
      </View>

      {/* Account status */}
      <Card variant="accent" accentColor={colors.success} style={{ marginTop: spacing.xxl }}>
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
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { marginTop: spacing.xl },
  walletCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  walletTop: { flexDirection: "row", alignItems: "center" },
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
    marginTop: spacing.xl,
  },
  tile: {
    width: "48%",
    aspectRatio: 1.15,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
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