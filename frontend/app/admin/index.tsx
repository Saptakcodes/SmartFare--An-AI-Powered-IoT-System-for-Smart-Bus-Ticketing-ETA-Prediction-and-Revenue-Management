import { useFocusEffect } from "expo-router";
import {
  Activity,
  Bus,
  DollarSign,
  Ticket,
  Users,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { Overview, getOverview } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminOverviewScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getOverview();
      setData(d);
    } catch (e: any) {
      setError(e?.detail || "Could not load overview");
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={[typography.h1, { color: colors.textPrimary }]}>
        Overview
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.xs },
        ]}
      >
        Snapshot of today's activity
      </Text>

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

      {data ? (
        <>
          <View style={styles.kpiRow}>
            <KPICard
              label="Revenue today"
              value={`₹ ${data.revenue_today.toFixed(0)}`}
              delta={data.revenue_delta_pct}
              Icon={DollarSign}
              colors={colors}
            />
            <KPICard
              label="Journeys today"
              value={String(data.journeys_today)}
              delta={data.journeys_delta_pct}
              Icon={Ticket}
              colors={colors}
            />
          </View>

          <View style={styles.kpiRow}>
            <KPICard
              label="Active buses"
              value={`${data.active_buses} / ${data.total_buses}`}
              Icon={Bus}
              colors={colors}
            />
            <KPICard
              label="Active trips"
              value={String(data.active_trips)}
              Icon={Activity}
              colors={colors}
            />
          </View>

          <View style={styles.kpiRow}>
            <KPICard
              label="Devices online"
              value={`${data.devices_online} / ${data.devices_total}`}
              Icon={Users}
              colors={colors}
              fullWidth
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function KPICard({
  label,
  value,
  delta,
  Icon,
  colors,
  fullWidth,
}: {
  label: string;
  value: string;
  delta?: number;
  Icon: any;
  colors: any;
  fullWidth?: boolean;
}) {
  const deltaColor = (delta ?? 0) >= 0 ? colors.success : colors.danger;

  return (
    <Card
      style={{
        flex: fullWidth ? 1 : 1,
      }}
    >
      <View style={styles.kpiTop}>
        <View
          style={[
            styles.kpiIcon,
            { backgroundColor: colors.primary + "22" },
          ]}
        >
          <Icon color={colors.accent} size={16} />
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          typography.numeric,
          { color: colors.textPrimary, marginTop: spacing.md },
        ]}
      >
        {value}
      </Text>
      {typeof delta === "number" ? (
        <Text
          style={[
            typography.caption,
            { color: deltaColor, marginTop: spacing.xs },
          ]}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}% vs yesterday
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  kpiTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});