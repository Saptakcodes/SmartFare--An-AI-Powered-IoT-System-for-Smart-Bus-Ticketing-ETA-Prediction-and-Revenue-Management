import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bus,
  Navigation,
  RefreshCw,
  Clock,
  MapPin,
  X,
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
import { StopPickerModal } from "../../components/ui/StopPickerModal";
import { fetchLiveBuses, getBusETA, LiveBus } from "../../lib/buses";
import { RouteDetail, getRouteDetail, RouteStopItem } from "../../lib/routes";
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

  // ETA States
  const [selectedBus, setSelectedBus] = useState<LiveBus | null>(null);
  const [showStopPicker, setShowStopPicker] = useState(false);
  const [targetStop, setTargetStop] = useState<RouteStopItem | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [calculatingEta, setCalculatingEta] = useState(false);
  const [busOffline, setBusOffline] = useState(false);

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

  async function calculateEta() {
    if (!selectedBus || !targetStop || !selectedBus.route_id) return;
    setCalculatingEta(true);
    setBusOffline(false);
    
    try {
      const res = await getBusETA(selectedBus.bus_id, selectedBus.route_id, targetStop.stop_id);
      
      if (res.status === "offline" || res.eta_minutes === null) {
        setBusOffline(true);
        setEta(null);
      } else {
        setEta(res.eta_minutes);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setCalculatingEta(false);
    }
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

          {/* --- ETA VIEW (Shows when a bus is tapped) --- */}
          {selectedBus ? (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.busIcon, { backgroundColor: colors.primary + "1A", marginRight: spacing.sm }]}>
                    <Bus color={colors.primary} size={16} />
                  </View>
                  <View>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "bold" }]}>
                      Bus {selectedBus.bus_id.slice(-4).toUpperCase()}
                    </Text>
                    <Text style={[typography.micro, { color: colors.textMuted }]}>Predicting ETA</Text>
                  </View>
                </View>
                <Pressable onPress={() => { setSelectedBus(null); setEta(null); setTargetStop(null); setBusOffline(false); }}>
                  <X color={colors.textMuted} size={20} />
                </Pressable>
              </View>

              {/* Stop Selector */}
              <Pressable
                onPress={() => setShowStopPicker(true)}
                style={[styles.stopSelector, { borderColor: colors.border, backgroundColor: "rgba(0,0,0,0.1)" }]}
              >
                <MapPin color={colors.accent} size={18} />
                <Text style={[typography.bodySm, { color: targetStop ? colors.textPrimary : colors.textMuted, marginLeft: 8 }]}>
                  {targetStop ? targetStop.name : "Select Destination Stop"}
                </Text>
              </Pressable>

              {/* Predict Button */}
              <Pressable
                onPress={calculateEta}
                disabled={!targetStop || calculatingEta}
                style={{
                  backgroundColor: !targetStop ? colors.textMuted : colors.accent,
                  padding: spacing.md, borderRadius: radii.md, alignItems: "center", marginTop: spacing.md
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  {calculatingEta ? "Predicting..." : "Predict ETA"}
                </Text>
              </Pressable>

              {/* Result */}
              {eta !== null && (
                <View style={{ backgroundColor: colors.success + "22", padding: spacing.md, borderRadius: radii.md, marginTop: spacing.md, alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
                  <Clock color={colors.success} size={20} />
                  <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 18, marginLeft: 8 }}>
                    Arriving in {eta} mins
                  </Text>
                </View>
              )}

              {/* Offline Warning */}
              {busOffline && (
                <View style={{ backgroundColor: colors.danger + "22", padding: spacing.md, borderRadius: radii.md, marginTop: spacing.md, alignItems: "center" }}>
                  <Text style={{ color: colors.danger, fontWeight: "bold", fontSize: 14 }}>
                    ⚠️ Bus is offline. GPS signal lost.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* --- DEFAULT VIEW (List of buses) --- */
            <>
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

              {buses.length === 0 ? (
                <View style={styles.emptyBuses}>
                  <Bus color={colors.textMuted} size={24} />
                  <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                    No buses currently moving on this route.
                  </Text>
                </View>
              ) : (
                buses.map((b) => (
                  <Pressable key={b.bus_id} onPress={() => setSelectedBus(b)} style={({ pressed }) => [styles.busRow, { opacity: pressed ? 0.7 : 1 }]}>
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
                  </Pressable>
                ))
              )}
            </>
          )}
        </GlassPanel>
      </SafeAreaView>

      {/* Stop Picker Modal */}
      <StopPickerModal
        visible={showStopPicker}
        title="Select Destination"
        onClose={() => setShowStopPicker(false)}
        onSelect={(stop) => {
          // Find the full RouteStopItem from the route
          const routeStop = route?.stops.find((s) => s.stop_id === stop.stop_id);
          if (routeStop) setTargetStop(routeStop);
          setShowStopPicker(false);
        }}
      />
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

  // ETA Specific Styles
  stopSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
  },
});