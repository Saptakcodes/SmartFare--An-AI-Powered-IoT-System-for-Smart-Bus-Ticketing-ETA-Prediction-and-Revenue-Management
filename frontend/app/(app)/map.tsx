import { useRouter } from "expo-router";
import { ArrowLeft, Bus, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LiveMap } from "../../components/feature/LiveMap";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { LiveBus, fetchLiveBuses } from "../../lib/buses";
import {
  RouteDetail,
  getRouteDetail,
} from "../../lib/routes";

// Kolkata center — matches our seed data
const DEFAULT_CENTER = { lat: 22.5465, lon: 88.3470 };
const DEFAULT_ROUTE = "R-001";

export default function MapScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, b] = await Promise.all([
        getRouteDetail(DEFAULT_ROUTE).catch(() => null),
        fetchLiveBuses(10).catch(() => [] as LiveBus[]),
      ]);
      if (r) setRoute(r);
      setBuses(b);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.detail || "Could not load map data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const stopsForMap =
    route?.stops.map((s) => ({
      stop_id: s.stop_id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      seq: s.seq,
    })) ?? [];

  const busesForMap = buses.map((b) => ({
    bus_id: b.bus_id,
    latitude: b.latitude,
    longitude: b.longitude,
    route_id: b.route_id,
  }));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, marginLeft: spacing.md, flex: 1 },
          ]}
        >
          Live Map
        </Text>
        <Pressable onPress={onRefresh} hitSlop={10} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <RefreshCw color={colors.textSecondary} size={20} />
          )}
        </Pressable>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <LiveMap
            center={DEFAULT_CENTER}
            zoom={12}
            routeStops={stopsForMap}
            buses={busesForMap}
          />
        )}
      </View>

      {/* Info bar */}
      <View
        style={[
          styles.infoBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.infoLeft}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  buses.length > 0 ? colors.success : colors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              typography.bodySm,
              { color: colors.textPrimary, marginLeft: spacing.sm },
            ]}
          >
            {buses.length} {buses.length === 1 ? "bus" : "buses"} online
          </Text>
        </View>
        <Text style={[typography.micro, { color: colors.textMuted }]}>
          {lastUpdated
            ? `Updated ${Math.floor(
                (Date.now() - lastUpdated.getTime()) / 1000
              )}s ago`
            : "—"}
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorBar, { backgroundColor: colors.danger + "22" }]}>
          <Text style={[typography.bodySm, { color: colors.danger }]}>
            {error}
          </Text>
        </View>
      ) : null}

      {!loading && buses.length === 0 ? (
        <View
          style={[
            styles.emptyBar,
            { backgroundColor: colors.warning + "22" },
          ]}
        >
          <Bus color={colors.warning} size={14} />
          <Text
            style={[
              typography.caption,
              { color: colors.warning, marginLeft: 6 },
            ]}
          >
            No live buses right now. The map shows the route only.
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
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
  mapWrap: { flex: 1, overflow: "hidden" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
  infoLeft: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  errorBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});