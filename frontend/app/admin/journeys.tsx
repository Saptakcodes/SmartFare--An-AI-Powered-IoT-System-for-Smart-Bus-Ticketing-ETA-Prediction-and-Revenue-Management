import { useFocusEffect } from "expo-router";
import { RefreshCw, Search, Ticket } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  
  // NEW: Search state
  const [search, setSearch] = useState("");

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

  // NEW: Filter logic
  const filteredJourneys = journeys.filter((j) => {
    const q = search.toLowerCase();
    return (
      j.user_email?.toLowerCase().includes(q) ||
      j.rfid_id.toLowerCase().includes(q) ||
      j.bus_id.toLowerCase().includes(q) ||
      j.route_id.toLowerCase().includes(q) ||
      j.journey_id.toLowerCase().includes(q)
    );
  });

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Journeys
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            All passenger journeys across the fleet
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* NEW: Search bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.textMuted} size={16} />
            <TextInput
              placeholder="Search email, bus, RFID..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={[
                typography.bodySm, 
                styles.searchInput, 
                { color: colors.textPrimary }, 
                Platform.OS === "web" && { outlineStyle: "none" } as any
              ]}
            />
          </View>

          <Pressable onPress={onRefresh} hitSlop={10} disabled={refreshing} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RefreshCw color={colors.textSecondary} size={18} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Table header */}
      <View
        style={[
          styles.tableHeader,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[typography.micro, styles.cell, styles.cellNarrow, { color: colors.textSecondary }]}>
          STARTED
        </Text>
        <Text style={[typography.micro, styles.cell, { color: colors.textSecondary, flex: 2 }]}>
          PASSENGER
        </Text>
        <Text style={[typography.micro, styles.cell, { color: colors.textSecondary, flex: 1.5 }]}>
          ROUTE
        </Text>
        <Text style={[typography.micro, styles.cell, { color: colors.textSecondary, flex: 2 }]}>
          BOARDING → EXIT
        </Text>
        <Text style={[typography.micro, styles.cell, styles.cellRight, { color: colors.textSecondary, width: 80 }]}>
          FARE
        </Text>
        <Text style={[typography.micro, styles.cell, styles.cellRight, { color: colors.textSecondary, width: 110 }]}>
          STATUS
        </Text>
      </View>

      {error ? (
        <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg }]}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : filteredJourneys.length === 0 ? (
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.emptyRow}>
            <Ticket color={colors.textMuted} size={24} />
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.md }]}>
              {search ? "No journeys match your search." : "No journeys yet. Once passengers start boarding, they'll appear here."}
            </Text>
          </View>
        </Card>
      ) : (
        filteredJourneys.map((j) => <JourneyRow key={j.journey_id} j={j} />)
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
      <View style={[styles.cell, styles.cellNarrow]}>
        <Text style={[typography.bodySm, { color: colors.textPrimary, fontWeight: "600" }]}>
          {dateStr.split(" ")[2]}
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
          {dateStr.split(" ")[0]} {dateStr.split(" ")[1]}
        </Text>
      </View>

      <View style={[styles.cell, { flex: 2 }]}>
        <Text style={[typography.bodySm, { color: colors.textPrimary, fontWeight: "500" }]} numberOfLines={1}>
          {j.user_email || "Unknown User"}
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
          RFID: {j.rfid_id.slice(0, 8)}...
        </Text>
      </View>

      <View style={[styles.cell, { flex: 1.5 }]}>
        <Text style={[typography.bodySm, { color: colors.textPrimary, fontWeight: "600" }]} numberOfLines={1}>
          {j.route_name || j.route_id}
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
          {j.bus_id}
        </Text>
      </View>

      <View style={[styles.cell, { flex: 2 }]}>
        <Text style={[typography.micro, { color: colors.textSecondary }]} numberOfLines={1}>
          <Text style={{ color: colors.success }}>• </Text>
          {j.boarding_stop_name || "—"}
        </Text>
        <Text style={[typography.micro, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>
          <Text style={{ color: colors.danger }}>• </Text>
          {j.latest_exit_stop_name || "—"}
        </Text>
      </View>

      <View style={[styles.cell, styles.cellRight, { width: 80 }]}>
        <Text style={[typography.numericSm, { color: colors.textPrimary }]}>
          ₹{j.total_fare.toFixed(0)}
        </Text>
      </View>

      <View style={[styles.cell, styles.cellRight, { width: 110 }]}>
        <View
          style={[
            styles.statePill,
            { backgroundColor: (stateColor[j.journey_state] || colors.textMuted) + "15" },
          ]}
        >
          <Text style={[typography.micro, { color: stateColor[j.journey_state] || colors.textMuted, fontWeight: "600" }]}>
            {j.journey_state}
          </Text>
        </View>
        <Text style={[typography.micro, { color: finColor[j.financial_state] || colors.textMuted, marginTop: 4, fontWeight: "500" }]}>
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
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 280,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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