import { useRouter } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  History,
  Info,
  LogOut,
  Moon,
  Shield,
  Sun,
  User as UserIcon,
  Wallet,
  Monitor,
  Bell,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { ThemeColors } from "../../theme/tokens";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

type ThemeMode = "light" | "dark" | "system";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors, mode, setMode } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<"en" | "bn" | "hi">("en");

  if (!user) return null;

  const initials = (user.full_name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function onSignOut() {
    const doSignOut = async () => {
      await signOut();
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const ok = window.confirm("Sign out of SmartFare?");
      if (ok) await doSignOut();
      return;
    }

    Alert.alert("Sign out?", "You'll need to log in again to continue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: doSignOut },
    ]);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          Profile
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          Manage your account and preferences
        </Text>

        {/* User card */}
        <Card style={{ marginTop: spacing.xl }}>
          <View style={styles.userRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text style={[typography.h3, { color: colors.primary }]}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text
                style={[typography.h3, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {user.full_name || "Passenger"}
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
                numberOfLines={1}
              >
                {user.email}
              </Text>
              <View style={styles.badgeRow}>
                {user.is_verified ? (
                  <View
                    style={[
                      styles.miniBadge,
                      { backgroundColor: colors.success + "22" },
                    ]}
                  >
                    <Shield color={colors.success} size={11} />
                    <Text
                      style={[
                        typography.micro,
                        { color: colors.success, marginLeft: 4 },
                      ]}
                    >
                      Verified
                    </Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.miniBadge,
                    {
                      backgroundColor: colors.primary + "22",
                      marginLeft: 6,
                    },
                  ]}
                >
                  <UserIcon color={colors.primary} size={11} />
                  <Text
                    style={[
                      typography.micro,
                      { color: colors.primary, marginLeft: 4 },
                    ]}
                  >
                    Passenger
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Account section */}
        <SectionTitle label="Account" colors={colors} />
        <Card padded={false}>
          <SettingRow
            icon={<Wallet color={colors.accent} size={18} />}
            label="Wallet"
            hint={`₹ ${Number(user.balance).toFixed(2)}`}
            onPress={() => router.push("/wallet")}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingRow
            icon={<CreditCard color={colors.accent} size={18} />}
            label="My cards"
            onPress={() => router.push("/card")}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingRow
            icon={<History color={colors.accent} size={18} />}
            label="Journey history"
            onPress={() => router.push("/journeys")}
            colors={colors}
          />
        </Card>

        {/* Preferences */}
        <SectionTitle label="Preferences" colors={colors} />
        <Card padded={false}>
          <View style={styles.themeRow}>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textPrimary, flex: 1 },
              ]}
            >
              Appearance
            </Text>
            <View
              style={[
                styles.segmented,
                { backgroundColor: colors.elevated },
              ]}
            >
              <ThemeChip
                active={mode === "light"}
                onPress={() => setMode("light")}
                Icon={Sun}
                colors={colors}
              />
              <ThemeChip
                active={mode === "dark"}
                onPress={() => setMode("dark")}
                Icon={Moon}
                colors={colors}
              />
              <ThemeChip
                active={mode === "system"}
                onPress={() => setMode("system")}
                Icon={Monitor}
                colors={colors}
              />
            </View>
          </View>
          <Divider colors={colors} />

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Bell color={colors.accent} size={18} />
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textPrimary, marginLeft: spacing.md },
                ]}
              >
                Push notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: colors.border,
                true: colors.accent + "88",
              }}
              thumbColor={notificationsEnabled ? colors.accent : "#fff"}
            />
          </View>
          <Divider colors={colors} />

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Globe color={colors.accent} size={18} />
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textPrimary, marginLeft: spacing.md },
                ]}
              >
                Language
              </Text>
            </View>
            <View style={styles.langRow}>
              {(["en", "bn", "hi"] as const).map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor:
                        language === l ? colors.primary + "22" : "transparent",
                      borderColor:
                        language === l ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.micro,
                      {
                        color:
                          language === l ? colors.primary : colors.textMuted,
                      },
                    ]}
                  >
                    {l.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Support */}
        <SectionTitle label="Support" colors={colors} />
        <Card padded={false}>
          <SettingRow
            icon={<HelpCircle color={colors.accent} size={18} />}
            label="Help & support"
            onPress={() => {
              if (Platform.OS === "web") {
                // eslint-disable-next-line no-alert
                window.alert("Support coming soon");
              } else {
                Alert.alert("Support", "Support coming soon");
              }
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingRow
            icon={<Info color={colors.accent} size={18} />}
            label="About SmartFare"
            hint="v1.0.0"
            onPress={() => {}}
            colors={colors}
          />
        </Card>

        {/* Logout */}
        <View style={{ height: spacing.xxl }} />
        <Button
          label="Sign out"
          variant="danger"
          onPress={onSignOut}
          icon={<LogOut color="#fff" size={18} />}
          size="lg"
        />

        <Text
          style={[
            typography.micro,
            {
              color: colors.textMuted,
              textAlign: "center",
              marginTop: spacing.xl,
            },
          ]}
        >
          SmartFare v1.0.0 · {user.user_id.slice(0, 8)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  label,
  colors,
}: {
  label: string;
  colors: ThemeColors;
}) {
  return (
    <Text
      style={[
        typography.caption,
        {
          color: colors.textSecondary,
          marginTop: spacing.xxl,
          marginBottom: spacing.sm,
          marginLeft: 4,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
      ]}
    >
      {label}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  hint,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable onPress={onPress} style={styles.settingRow}>
      {icon}
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textPrimary, marginLeft: spacing.md, flex: 1 },
        ]}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={[
            typography.bodySm,
            { color: colors.textSecondary, marginRight: spacing.sm },
          ]}
        >
          {hint}
        </Text>
      ) : null}
      <ChevronRight color={colors.textMuted} size={18} />
    </Pressable>
  );
}

function Divider({ colors }: { colors: ThemeColors }) {
  return (
    <View
      style={{
        height: 1,
        marginLeft: spacing.xxxl + spacing.md,
        backgroundColor: colors.border,
      }}
    />
  );
}

function ThemeChip({
  active,
  onPress,
  Icon,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  Icon: any;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeChip,
        {
          backgroundColor: active ? colors.surface : "transparent",
        },
      ]}
    >
      <Icon
        color={active ? colors.accent : colors.textMuted}
        size={16}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: { flexDirection: "row", marginTop: spacing.sm },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: radii.md,
    padding: 3,
  },
  themeChip: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  switchLeft: { flexDirection: "row", alignItems: "center" },
  langRow: { flexDirection: "row", gap: spacing.xs },
  langChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
});