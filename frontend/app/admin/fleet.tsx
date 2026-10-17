import { useFocusEffect } from "expo-router";
import { Bus, MapPin, Navigation, RefreshCw } from "lucide-react-native";
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
import { useLayout } from "../../lib/useLayout";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

const KOLKATA_CENTER = { lat: 22.5465, lon: 88.3470 };

export default function AdminFleetScreen() {
  const { colors } = useTheme();
  const { isDesktop } = useLayout();
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

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

  // Shared Header Component
  const Header = () => (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          Live Fleet
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
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
  );

  // Shared Stat Chips Component
  const Stats = () => (
    <View style={styles.chipsRow}>
      <StatChip label="Online" count={online} color={colors.success} />
      <StatChip label="Idle" count={idle} color={colors.warning} />
      <StatChip label="Offline" count={offline} color={colors.textMuted} />
    </View>
  );

  // Map Component
  const MapView = () => (
    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
      {loading ? (
        <View style={styles.mapCenter}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <LiveMap
          center={KOLKATA_CENTER}
          zoom={12}
          buses={busesForMap}
          onBusPress={(id) => setSelectedBusId(id)}
        />
      )}
    </View>
  );

  // Bus List Component
  const BusList = () => (
    <View style={styles.listContent}>
      {buses.length === 0 ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
            No buses registered.
          </Text>
        </Card>
      ) : (
        buses.map((b) => (
          <BusRow 
            key={b.bus_id} 
            bus={b} 
            isSelected={selectedBusId === b.bus_id}
            onPress={() => setSelectedBusId(b.bus_id)}
          />
        ))
      )}
    </View>
  );

  // Mobile Layout (Single column scroll)
  if (!isDesktop) {
    return (
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
        <Header />
        <Stats />
        <View style={{ height: 380, marginTop: spacing.lg, borderRadius: radii.lg, overflow: "hidden" }}>
          <MapView />
        </View>
        {error ? (
          <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
        ) : null}
        <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xxl }]}>
          All buses ({buses.length})
        </Text>
        <BusList />
      </ScrollView>
    );
  }

  // Desktop Layout (Split screen Command Center)
  return (
    <View style={[styles.desktopContainer, { backgroundColor: colors.bg }]}>
      <Header />
      <Stats />
      
      <View style={styles.splitLayout}>
        {/* Left: Map */}
        <View style={{ flex: 2 }}>
          <MapView />
        </View>

        {/* Right: List */}
        <View style={[styles.listContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>All buses</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{buses.length} total</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <BusList />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: color + "15", borderColor: color + "33" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[typography.caption, { color: colors.textPrimary, marginLeft: spacing.sm, fontWeight: "600" }]}>
        {count}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
        {label}
      </Text>
    </View>
  );
}

function BusRow({ bus, isSelected, onPress }: { bus: FleetBus; isSelected?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();

  const statusColor =
    bus.status === "online" ? colors.success : bus.status === "idle" ? colors.warning : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { marginTop: spacing.md, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Card style={[
        { 
          borderColor: isSelected ? colors.primary + "55" : colors.border,
          backgroundColor: isSelected ? colors.primary + "11" : colors.surface,
        },
        isSelected && elevation.sm
      ]}>
        <View style={styles.busRow}>
          <View style={[styles.busIcon, { backgroundColor: statusColor + "15" }]}>
            <Bus color={statusColor} size={18} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "600" }]}>
              {bus.bus_id}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {bus.route_id ? `Route ${bus.route_id}` : "No active route"}
              {bus.trip_id ? ` · ${bus.trip_id}` : ""}
            </Text>
            {bus.latitude != null ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MapPin color={colors.textMuted} size={10} />
                  <Text style={[typography.micro, { color: colors.textMuted, marginLeft: 3 }]}>
                    {bus.latitude.toFixed(3)}, {bus.longitude?.toFixed(3)}
                  </Text>
                </View>
                {bus.speed_kmph != null && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Navigation color={colors.textMuted} size={10} />
                    <Text style={[typography.micro, { color: colors.textMuted, marginLeft: 3 }]}>
                      {bus.speed_kmph.toFixed(0)} km/h
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "15" }]}>
            <Text style={[typography.micro, { color: statusColor, fontWeight: "600" }]}>
              {bus.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  desktopContainer: {
    flex: 1,
    padding: spacing.xxl,
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
  
  // Desktop Split Layout
  splitLayout: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  mapContainer: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
  },
  mapCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050B1E",
  },
  listContainer: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },

  // Bus Row
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