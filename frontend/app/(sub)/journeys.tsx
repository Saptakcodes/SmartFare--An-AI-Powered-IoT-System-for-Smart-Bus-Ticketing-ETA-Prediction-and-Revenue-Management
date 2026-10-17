import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bus,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/ui/Card";
import { Journey, listMyJourneys } from "../../lib/journeys";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function JourneysScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listMyJourneys();
      setJourneys(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load journeys");
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

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, marginLeft: spacing.lg },
            ]}
          >
            Journey History
          </Text>
        </View>

        {error ? (
          <Text
            style={[
              typography.bodySm,
              { color: colors.danger, marginTop: spacing.lg },
            ]}
          >
            {error}
          </Text>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !journeys || journeys.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Bus color={colors.primary} size={32} />
            </View>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginTop: spacing.xl },
              ]}
            >
              No journeys yet
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
              Your trips will appear here after you board a SmartFare bus.
            </Text>
          </View>
        ) : (
          journeys.map((j) => <JourneyCard key={j.journey_id} journey={j} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function JourneyCard({ journey }: { journey: Journey }) {
  const { colors } = useTheme();
  const date = new Date(journey.started_at);

  // Kept your exact state colors logic
  const stateColor: Record<string, string> = {
    ACTIVE: colors.accent,
    POSSIBLE_EXIT: colors.warning,
    COMPLETED: colors.success,
    RECONCILED: colors.textSecondary,
  };

  const finColor: Record<string, string> = {
    PENDING: colors.textMuted,
    PARTIAL: colors.warning,
    SETTLED: colors.success,
    REFUNDED: colors.info,
  };

  const isSettled = journey.financial_state === "SETTLED";
  const isPending = journey.outstanding_amount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        { marginTop: spacing.lg, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Card style={elevation.sm}>
        {/* Top row: Route & Date */}
        <View style={styles.row}>
          <View
            style={[
              styles.routeBadge,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Bus color={colors.primary} size={12} />
            <Text
              style={[
                typography.micro,
                { color: colors.primary, marginLeft: 4, fontWeight: "700" },
              ]}
            >
              {journey.route_id}
            </Text>
          </View>
          <Text
            style={[
              typography.bodySm,
              {
                color: colors.textPrimary,
                marginLeft: spacing.md,
                flex: 1,
                fontWeight: "600",
              },
            ]}
            numberOfLines={1}
          >
            {journey.route_name || "Route"}
          </Text>
          <Text style={[typography.micro, { color: colors.textMuted }]}>
            {date.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}{" "}
            ·{" "}
            {date.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.stopsRow}>
          <View style={styles.stopLine}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          </View>
          <View style={styles.stopLabels}>
            <View>
              <Text style={[typography.micro, { color: colors.textSecondary, textTransform: "uppercase" }]}>
                Boarded
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.textPrimary, fontWeight: "600", marginTop: 2 },
                ]}
              >
                {journey.boarding_stop_name || "—"}
              </Text>
            </View>
            <View style={{ marginTop: spacing.xl }}>
              <Text style={[typography.micro, { color: colors.textSecondary, textTransform: "uppercase" }]}>
                Exited
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.textPrimary, fontWeight: "600", marginTop: 2 },
                ]}
              >
                {journey.latest_exit_stop_name || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.chipRow}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor:
                    (stateColor[journey.journey_state] || colors.textMuted) +
                    "15",
                },
              ]}
            >
              <Text
                style={[
                  typography.micro,
                  {
                    color:
                      stateColor[journey.journey_state] || colors.textMuted,
                    fontWeight: "600",
                  },
                ]}
              >
                {journey.journey_state}
              </Text>
            </View>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor:
                    (finColor[journey.financial_state] || colors.textMuted) +
                    "15",
                  marginLeft: spacing.sm,
                },
              ]}
            >
              {isSettled ? (
                <CheckCircle2 color={finColor[journey.financial_state]} size={10} />
              ) : (
                <Clock color={finColor[journey.financial_state]} size={10} />
              )}
              <Text
                style={[
                  typography.micro,
                  {
                    color:
                      finColor[journey.financial_state] || colors.textMuted,
                    marginLeft: 4,
                    fontWeight: "600",
                  },
                ]}
              >
                {journey.financial_state}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              ₹ {journey.total_fare.toFixed(2)}
            </Text>
            {isPending && (
              <Text
                style={[
                  typography.micro,
                  { color: colors.danger, marginTop: 2, fontWeight: "600" },
                ]}
              >
                ₹{journey.outstanding_amount.toFixed(2)} due
              </Text>
            )}
          </View>
        </View>
      </Card>
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
  header: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", marginTop: spacing.xxxl },
  empty: {
    alignItems: "center",
    marginTop: spacing.xxxl * 1.5,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  stopsRow: { flexDirection: "row", marginTop: spacing.xl },
  stopLine: { width: 12, alignItems: "center", paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, height: 36, marginVertical: 3 },
  stopLabels: { marginLeft: spacing.md, flex: 1 },
  divider: { height: 1, marginVertical: spacing.lg },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipRow: { flexDirection: "row" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
});