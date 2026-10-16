import { useFocusEffect } from "expo-router";
import { RefreshCw, Ticket } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { AdminJourney, getAdminJourneys } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminJourneysScreen() {
  const { colors } = useTheme();
  const [journeys, setJourneys] = useState<AdminJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getAdminJourneys(200);
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

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Journeys
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            All passenger journeys across the fleet
          </Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={10} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <RefreshCw color={colors.textSecondary} size={20} />
          )}
        </Pressable>
      </View>

      {/* Table header */}
      <View
        style={[
          styles.tableHeader,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            typography.micro,
            styles.cell,
            styles.cellNarrow,
            { color: colors.textSecondary },
          ]}
        >
          STARTED
        </Text>
        <Text
          style={[
            typography.micro,
            styles.cell,
            { color: colors.textSecondary, flex: 2 },
          ]}
        >
          PASSENGER
        </Text>
        <Text
          style={[
            typography.micro,
            styles.cell,
            { color: colors.textSecondary, flex: 1.5 },
          ]}
        >
          ROUTE
        </Text>
        <Text
          style={[
            typography.micro,
            styles.cell,
            { color: colors.textSecondary, flex: 2 },
          ]}
        >
          BOARDING → EXIT
        </Text>
        <Text
          style={[
            typography.micro,
            styles.cell,
            styles.cellRight,
            { color: colors.textSecondary, width: 80 },
          ]}
        >
          FARE
        </Text>
        <Text
          style={[
            typography.micro,
            styles.cell,
            styles.cellRight,
            { color: colors.textSecondary, width: 110 },
          ]}
        >
          STATUS
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
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : journeys.length === 0 ? (
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.emptyRow}>
            <Ticket color={colors.textMuted} size={24} />
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: spacing.md,
                },
              ]}
            >
              No journeys yet. Once passengers start boarding, they'll appear here.
            </Text>
          </View>
        </Card>
      ) : (
        journeys.map((j) => <JourneyRow key={j.journey_id} j={j} />)
      )}
    </ScrollView>
  );
}

function JourneyRow({ j }: { j: AdminJourney }) {
  const { colors } = useTheme();

  const date = new Date(j.started_at);
  const dateStr =
    date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) +
    " " +
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

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
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          typography.bodySm,
          styles.cell,
          styles.cellNarrow,
          { color: colors.textPrimary },
        ]}
      >
        {dateStr}
      </Text>
      <Text
        style={[
          typography.bodySm,
          styles.cell,
          { color: colors.textPrimary, flex: 2 },
        ]}
        numberOfLines={1}
      >
        {j.user_email || j.rfid_id.slice(0, 12)}
      </Text>
      <Text
        style={[
          typography.bodySm,
          styles.cell,
          { color: colors.textPrimary, flex: 1.5 },
        ]}
        numberOfLines={1}
      >
        {j.route_name || j.route_id}
      </Text>
      <Text
        style={[
          typography.bodySm,
          styles.cell,
          { color: colors.textSecondary, flex: 2 },
        ]}
        numberOfLines={1}
      >
        {(j.boarding_stop_name || "—") + " → " + (j.latest_exit_stop_name || "—")}
      </Text>
      <Text
        style={[
          typography.numericSm,
          styles.cell,
          styles.cellRight,
          { color: colors.textPrimary, width: 80 },
        ]}
      >
        ₹{j.total_fare.toFixed(0)}
      </Text>
      <View style={[styles.cell, styles.cellRight, { width: 110 }]}>
        <View
          style={[
            styles.statePill,
            {
              backgroundColor:
                (stateColor[j.journey_state] || colors.textMuted) + "22",
            },
          ]}
        >
          <Text
            style={[
              typography.micro,
              {
                color: stateColor[j.journey_state] || colors.textMuted,
              },
            ]}
          >
            {j.journey_state}
          </Text>
        </View>
        <Text
          style={[
            typography.micro,
            {
              color: finColor[j.financial_state] || colors.textMuted,
              marginTop: 2,
            },
          ]}
        >
          {j.financial_state}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  center: { alignItems: "center", marginTop: spacing.xxxl },
  emptyRow: { alignItems: "center", paddingVertical: spacing.xl },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  cell: { paddingRight: spacing.sm },
  cellNarrow: { width: 100 },
  cellRight: { textAlign: "right", paddingRight: 0, alignItems: "flex-end" },
  statePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
});