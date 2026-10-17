import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Bus,
  Check,
  CreditCard,
  Info,
  Wallet,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/ui/Card";
import {
  Notification,
  listNotifications,
  markAllNotificationsRead,
} from "../../lib/notifications";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Icons mapped to backend notification types
const ICONS: Record<string, any> = {
  arrival: Bus,
  fare: Wallet,
  journey: Check,
  card: CreditCard,
  info: Info,
};

const COLORS: Record<string, string> = {
  arrival: "#22D3EE",
  fare: "#FFC857",
  journey: "#2EE6A6",
  card: "#1E6BFF",
  info: "#5AB0FF",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listNotifications();
      setItems(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  async function markAllRead() {
    // Optimistic UI update
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // Revert if it fails
      load();
    }
  }

  const hasUnread = items.some((n) => !n.is_read);

  function formatTime(isoString: string) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text
          style={[
            typography.h2,
            { color: colors.textPrimary, marginLeft: spacing.lg, flex: 1 },
          ]}
        >
          Notifications
        </Text>
        {hasUnread ? (
          <Pressable onPress={markAllRead} hitSlop={10}>
            <Text style={[typography.bodySm, { color: colors.accent }]}>
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          style={[
            typography.bodySm,
            { color: colors.danger, textAlign: "center", marginTop: spacing.lg },
          ]}
        >
          {error}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Bell color={colors.primary} size={32} />
          </View>
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, marginTop: spacing.xl },
            ]}
          >
            You're all caught up
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: spacing.sm,
              },
            ]}
          >
            We'll notify you about arrivals, fare updates, and card status.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <NotifRow notif={item} formatTime={formatTime} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function NotifRow({
  notif,
  formatTime,
}: {
  notif: Notification;
  formatTime: (d: string) => string;
}) {
  const { colors } = useTheme();
  const Icon = ICONS[notif.type] || Info;
  const accent = COLORS[notif.type] || colors.primary;

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Card
        variant="solid"
        style={[
          styles.card,
          !notif.is_read ? { borderColor: accent + "55" } : null,
        ]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: accent + "1A" },
            ]}
          >
            <Icon color={accent} size={18} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: colors.textPrimary,
                    fontWeight: !notif.is_read ? "700" : "600",
                    flex: 1,
                  },
                ]}
              >
                {notif.title}
              </Text>
              {!notif.is_read ? (
                <View
                  style={[styles.unreadDot, { backgroundColor: colors.accent }]}
                />
              ) : null}
            </View>
            <Text
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              {notif.body}
            </Text>
            <Text
              style={[
                typography.micro,
                { color: colors.textMuted, marginTop: 6 },
              ]}
            >
              {formatTime(notif.created_at)}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: { borderRadius: radii.lg },
  row: { flexDirection: "row", alignItems: "flex-start" },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});