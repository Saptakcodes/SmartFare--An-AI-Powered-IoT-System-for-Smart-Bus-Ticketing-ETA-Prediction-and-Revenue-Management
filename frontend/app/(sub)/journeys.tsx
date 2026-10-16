import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Bus, MapPin } from "lucide-react-native";
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
import { radii, spacing } from "../../theme/tokens";
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
            Journey history
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

  return (
    <Card style={{ marginTop: spacing.lg }}>
      <View style={styles.row}>
        <View
          style={[
            styles.routeBadge,
            { backgroundColor: colors.primary + "22" },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.primary }]}>
            {journey.route_id}
          </Text>
        </View>
        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.textPrimary,
              marginLeft: spacing.md,
              flex: 1,
            },
          ]}
        >
          {journey.route_name || "Route"}
        </Text>
        <Text
          style={[typography.micro, { color: colors.textMuted }]}
        >
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

      <View style={styles.stopsRow}>
        <View style={styles.stopLine}>
          <View
            style={[styles.dot, { backgroundColor: colors.success }]}
          />
          <View
            style={[styles.line, { backgroundColor: colors.border }]}
          />
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        </View>
        <View style={styles.stopLabels}>
          <View>
            <Text
              style={[typography.micro, { color: colors.textSecondary }]}
            >
              Boarded
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textPrimary, marginTop: 2 },
              ]}
            >
              {journey.boarding_stop_name || "—"}
            </Text>
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[typography.micro, { color: colors.textSecondary }]}
            >
              Exited
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textPrimary, marginTop: 2 },
              ]}
            >
              {journey.latest_exit_stop_name || "—"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.chipRow}>
          <View
            style={[
              styles.chip,
              { backgroundColor: (stateColor[journey.journey_state] || colors.textMuted) + "22" },
            ]}
          >
            <Text
              style={[
                typography.micro,
                { color: stateColor[journey.journey_state] || colors.textMuted },
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
                  "22",
                marginLeft: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.micro,
                {
                  color:
                    finColor[journey.financial_state] || colors.textMuted,
                },
              ]}
            >
              {journey.financial_state}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[typography.caption, { color: colors.textSecondary }]}
          >
            Fare
          </Text>
          <Text
            style={[
              typography.numericSm,
              { color: colors.textPrimary, marginTop: 2 },
            ]}
          >
            ₹ {journey.total_fare.toFixed(2)}
          </Text>
        </View>
      </View>
    </Card>
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
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  stopsRow: { flexDirection: "row", marginTop: spacing.xl },
  stopLine: { width: 12, alignItems: "center", paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, height: 40, marginVertical: 3 },
  stopLabels: { marginLeft: spacing.md, flex: 1 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  chipRow: { flexDirection: "row" },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
});