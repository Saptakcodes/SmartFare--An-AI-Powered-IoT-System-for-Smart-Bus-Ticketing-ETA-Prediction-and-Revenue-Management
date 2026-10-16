import { useFocusEffect } from "expo-router";
import {
  Activity,
  RefreshCw,
  Satellite,
  Wifi,
  WifiOff,
} from "lucide-react-native";
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
import { DeviceHealth, getDevices } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminDevicesScreen() {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load devices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 20000);
      return () => clearInterval(id);
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const online = devices.filter((d) => d.status === "online").length;
  const stale = devices.filter((d) => d.status === "stale").length;
  const offline = devices.filter((d) => d.status === "offline").length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Devices
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            Raspberry Pi health and connectivity
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

      <View style={styles.chipsRow}>
        <StatChip label="Online" count={online} color={colors.success} />
        <StatChip label="Stale" count={stale} color={colors.warning} />
        <StatChip label="Offline" count={offline} color={colors.textMuted} />
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
      ) : devices.length === 0 ? (
        <Card style={{ marginTop: spacing.xl }}>
          <View style={styles.emptyRow}>
            <Activity color={colors.textMuted} size={24} />
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
              No devices have checked in yet. Raspberry Pi devices will appear
              here after they call /sync/device/heartbeat.
            </Text>
          </View>
        </Card>
      ) : (
        devices.map((d) => <DeviceCard key={d.device_id} device={d} />)
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

function DeviceCard({ device }: { device: DeviceHealth }) {
  const { colors } = useTheme();
  const statusColor =
    device.status === "online"
      ? colors.success
      : device.status === "stale"
      ? colors.warning
      : colors.textMuted;

  return (
    <Card style={{ marginTop: spacing.lg }}>
      <View style={styles.deviceHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[typography.h3, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {device.device_id}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            {device.bus_id ? `Bus ${device.bus_id}` : "Not assigned"}
            {device.app_version ? ` · v${device.app_version}` : ""}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusColor + "22" },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text
            style={[
              typography.micro,
              { color: statusColor, marginLeft: 4 },
            ]}
          >
            {device.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.signals}>
        <Signal
          label="GPS"
          ok={device.gps_ok}
          Icon={Satellite}
          colors={colors}
        />
        <Signal
          label="RFID"
          ok={device.rfid_ok}
          Icon={Activity}
          colors={colors}
        />
        <Signal
          label="Network"
          ok={device.network_ok}
          Icon={device.network_ok ? Wifi : WifiOff}
          colors={colors}
        />
      </View>

      <Text
        style={[
          typography.micro,
          { color: colors.textMuted, marginTop: spacing.lg },
        ]}
      >
        {device.minutes_since_seen != null
          ? device.minutes_since_seen < 1
            ? "Last seen: just now"
            : `Last seen: ${device.minutes_since_seen} min ago`
          : "Never seen"}
      </Text>
    </Card>
  );
}

function Signal({
  label,
  ok,
  Icon,
  colors,
}: {
  label: string;
  ok: boolean | null;
  Icon: any;
  colors: any;
}) {
  const color =
    ok === true ? colors.success : ok === false ? colors.danger : colors.textMuted;
  return (
    <View style={styles.signal}>
      <Icon color={color} size={16} />
      <Text
        style={[
          typography.micro,
          { color, marginTop: 4, fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
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
  center: { alignItems: "center", marginTop: spacing.xxxl },
  emptyRow: { alignItems: "center", paddingVertical: spacing.xl },
  deviceHeader: { flexDirection: "row", alignItems: "center" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  signals: {
    flexDirection: "row",
    gap: spacing.xxl,
    marginTop: spacing.lg,
  },
  signal: { alignItems: "center" },
});