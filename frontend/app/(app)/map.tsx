import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bus,
  Navigation,
  RefreshCw,
  Signal,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LiveMap } from "../../components/feature/LiveMap";
import { fetchLiveBuses, LiveBus } from "../../lib/buses";
import { RouteDetail, getRouteDetail } from "../../lib/routes";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

const DEFAULT_CENTER = { lat: 22.5465, lon: 88.3470 };
const DEFAULT_ROUTE = "R-001";

export default function MapScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([
        getRouteDetail(DEFAULT_ROUTE).catch(() => null),
        fetchLiveBuses(10).catch(() => [] as LiveBus[]),
      ]);
      if (r) setRoute(r);
      setBuses(b);
      setLastUpdated(new Date());
    } catch (e) {
      // silently fail, map still works
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

  const stopsForMap = route?.stops.map((s) => ({
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

  // Glassmorphism fallback for web if blur isn't supported perfectly
  const GlassPanel = Platform.OS === "web" ? View : BlurView;
  const glassProps = Platform.OS === "web" ? {} : { intensity: isDark ? 50 : 70, tint: isDark ? "dark" : "light" };

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Map */}
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

      {/* 2. Floating Top Bar */}
      <SafeAreaView style={styles.topBarContainer} edges={["top"]}>
        <GlassPanel
          {...glassProps}
          style={[
            styles.glassPanel,
            { borderColor: colors.border, backgroundColor: Platform.OS === "web" ? colors.surface : "transparent" },
          ]}
        >
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </Pressable>
          
          <View style={styles.titleWrap}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              Live Map
            </Text>
            <Text style={[typography.micro, { color: colors.textSecondary }]}>
              {route?.name || "Tracking"}
            </Text>
          </View>

          <Pressable onPress={onRefresh} hitSlop={10} disabled={refreshing} style={styles.iconBtn}>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RefreshCw color={colors.textPrimary} size={18} />
            )}
          </Pressable>
        </GlassPanel>
      </SafeAreaView>

      {/* 3. Floating Bottom Sheet */}
      <SafeAreaView style={styles.bottomSheetContainer} edges={["bottom"]} pointerEvents="box-none">
        <GlassPanel
          {...glassProps}
          style={[
            styles.bottomPanel,
            { borderColor: colors.border, backgroundColor: Platform.OS === "web" ? colors.surface : "transparent" },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.dot, { backgroundColor: buses.length > 0 ? colors.success : colors.textMuted }]} />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
                {buses.length} {buses.length === 1 ? "bus" : "buses"} active
              </Text>
            </View>
            <Text style={[typography.micro, { color: colors.textMuted }]}>
              {lastUpdated ? `Updated ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago` : "—"}
            </Text>
          </View>

          {/* List of active buses */}
          {buses.length === 0 ? (
            <View style={styles.emptyBuses}>
              <Bus color={colors.textMuted} size={24} />
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                No buses currently moving on this route.
              </Text>
            </View>
          ) : (
            buses.map((b) => (
              <View key={b.bus_id} style={styles.busRow}>
                <View style={[styles.busIcon, { backgroundColor: colors.primary + "1A" }]}>
                  <Bus color={colors.primary} size={16} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.bodySm, { color: colors.textPrimary, fontWeight: "600" }]}>
                    Bus {b.bus_id.slice(-4).toUpperCase()}
                  </Text>
                  <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
                    Trip {b.trip_id?.split("-").pop() || "N/A"}
                  </Text>
                </View>
                <View style={styles.busMeta}>
                  <Navigation color={colors.accent} size={12} />
                  <Text style={[typography.micro, { color: colors.accent, marginLeft: 4 }]}>
                    {b.speed_kmph ? `${b.speed_kmph.toFixed(0)} km/h` : "Moving"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassPanel>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  
  // Floating Top Bar
  topBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  glassPanel: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Floating Bottom Sheet
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bottomPanel: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(150,150,150,0.3)",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statusLeft: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  
  emptyBuses: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  
  busRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.1)",
  },
  busIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  busMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
});