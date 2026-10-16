import { useFocusEffect } from "expo-router";
import { Bus, RefreshCw } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LiveMap } from "../../components/feature/LiveMap";
import { Card } from "../../components/ui/Card";
import { FleetBus, getFleet } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

const KOLKATA_CENTER = { lat: 22.5465, lon: 88.3470 };

export default function AdminFleetScreen() {
  const { colors } = useTheme();
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getFleet();
      setBuses(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load fleet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 15000);
      return () => clearInterval(id);
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const busesForMap = buses
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      bus_id: b.bus_id,
      latitude: b.latitude!,
      longitude: b.longitude!,
      route_id: b.route_id,
    }));

  const online = buses.filter((b) => b.status === "online").length;
  const idle = buses.filter((b) => b.status === "idle").length;
  const offline = buses.filter((b) => b.status === "offline").length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Live Fleet
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            Real-time bus positions and trip status
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

      {/* Stat chips */}
      <View style={styles.chipsRow}>
        <StatChip label="Online" count={online} color={colors.success} />
        <StatChip label="Idle" count={idle} color={colors.warning} />
        <StatChip label="Offline" count={offline} color={colors.textMuted} />
      </View>

      {/* Map */}
      <Card padded={false} style={{ marginTop: spacing.lg, overflow: "hidden" }}>
        <View style={{ height: 420 }}>
          {loading ? (
            <View style={styles.mapCenter}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <LiveMap
              center={KOLKATA_CENTER}
              zoom={12}
              buses={busesForMap}
            />
          )}
        </View>
      </Card>

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

      {/* Bus list */}
      <Text
        style={[
          typography.h3,
          { color: colors.textPrimary, marginTop: spacing.xxl },
        ]}
      >
        All buses ({buses.length})
      </Text>

      {buses.length === 0 ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            No buses registered.
          </Text>
        </Card>
      ) : (
        buses.map((b) => <BusRow key={b.bus_id} bus={b} />)
      )}
    </ScrollView>
  );
}

function StatChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: color + "22", borderColor: color + "44" },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          typography.caption,
          { color, marginLeft: spacing.sm, fontWeight: "600" },
        ]}
      >
        {label} · {count}
      </Text>
    </View>
  );
}

function BusRow({ bus }: { bus: FleetBus }) {
  const { colors } = useTheme();

  const statusColor =
    bus.status === "online"
      ? colors.success
      : bus.status === "idle"
      ? colors.warning
      : colors.textMuted;

  return (
    <Card style={{ marginTop: spacing.md }}>
      <View style={styles.busRow}>
        <View
          style={[
            styles.busIcon,
            { backgroundColor: colors.primary + "22" },
          ]}
        >
          <Bus color={colors.accent} size={18} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[typography.bodyMedium, { color: colors.textPrimary }]}
          >
            {bus.bus_id}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            {bus.route_id ? `Route ${bus.route_id}` : "No active route"}
            {bus.trip_id ? ` · ${bus.trip_id}` : ""}
          </Text>
          {bus.latitude != null ? (
            <Text
              style={[
                typography.micro,
                { color: colors.textMuted, marginTop: 2 },
              ]}
            >
              {bus.latitude.toFixed(4)}, {bus.longitude?.toFixed(4)}
              {bus.speed_kmph ? ` · ${bus.speed_kmph.toFixed(1)} km/h` : ""}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusColor + "22" },
          ]}
        >
          <Text style={[typography.micro, { color: statusColor }]}>
            {bus.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </Card>
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
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  mapCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050B1E",
  },
  busRow: { flexDirection: "row", alignItems: "center" },
  busIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
});