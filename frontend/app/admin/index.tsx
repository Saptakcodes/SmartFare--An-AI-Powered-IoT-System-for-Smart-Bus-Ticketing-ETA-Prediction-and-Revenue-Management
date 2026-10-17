import { useFocusEffect } from "expo-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bus,
  CreditCard,
  DollarSign,
  Ticket,
  Users,
  ScanLine,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { Overview, getOverview } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminOverviewScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Date Range State
  const [range, setRange] = useState<1 | 7 | 30>(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getOverview(range);
      setData(d);
    } catch (e: any) {
      setError(e?.detail || "Could not load overview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading && !data) {
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Header & Interactive Date Range */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Overview</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Real-time snapshot of your transit network
          </Text>
        </View>
        
        {/* Date Range Selector */}
        <View style={[styles.rangeSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([1, 7, 30] as const).map((d) => (
            <Pressable
              key={d}
              onPress={() => setRange(d)}
              style={[
                styles.rangeBtn,
                range === d && { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text
                style={[
                  typography.bodySm,
                  {
                    color: range === d ? colors.primary : colors.textSecondary,
                    fontWeight: range === d ? "600" : "500",
                  },
                ]}
              >
                {d === 1 ? "Today" : `${d} Days`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* CONDUCTOR PORTAL SHORTCUT */}
      <Pressable 
        onPress={() => {
          if (Platform.OS === "web") {
            window.open("/conductor", "_blank");
          } else {
            // In case they open admin on phone, just navigate
            import("expo-router").then(m => m.router.push("/conductor"));
          }
        }} 
        style={{ 
          marginTop: spacing.xl, 
          backgroundColor: colors.accent + "15", 
          paddingVertical: spacing.md, 
          paddingHorizontal: spacing.lg,
          borderRadius: radii.md, 
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.accent + "33"
        }}
      >
        <ScanLine color={colors.accent} size={18} />
        <Text style={{ color: colors.accent, fontWeight: "700", marginLeft: spacing.sm }}>
          Open Conductor Scanner Portal ↗
        </Text>
      </Pressable>

      {error ? (
        <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg }]}>
          {error}
        </Text>
      ) : null}

      {data ? (
        <>
          {/* Expanded 6-Card KPI Grid */}
          <View style={styles.kpiGrid}>
            <KPICard
              label={`Revenue (${range === 1 ? "Today" : `${range} Days`})`}
              value={`₹ ${data.revenue_today.toFixed(0)}`}
              delta={data.revenue_delta_pct}
              Icon={DollarSign}
              colors={colors}
              highlight
            />
            <KPICard
              label="Journeys"
              value={String(data.journeys_today)}
              delta={data.journeys_delta_pct}
              Icon={Ticket}
              colors={colors}
            />
            <KPICard
              label="Active Fleet"
              value={`${data.active_buses} / ${data.total_buses}`}
              hint="On the road"
              Icon={Bus}
              colors={colors}
            />
            <KPICard
              label="Registered Users"
              value={String(data.total_users)}
              hint="Passengers"
              Icon={Users}
              colors={colors}
            />
            <KPICard
              label="RFID Cards"
              value={String(data.total_cards)}
              hint="Linked"
              Icon={CreditCard}
              colors={colors}
            />
            <KPICard
              label="Active Trips"
              value={String(data.active_trips)}
              hint={`${data.total_routes} routes active`}
              Icon={Activity}
              colors={colors}
            />
          </View>

          {/* Chart Section */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Revenue Trend</Text>
              <Text style={[typography.caption, { color: colors.accent }]}>
                {range === 1 ? "Last 7 days" : `Last ${range} days`}
              </Text>
            </View>
            
            <Card style={{ marginTop: spacing.md, height: 240, justifyContent: "center", alignItems: "center" }}>
              <View style={styles.fakeChartRow}>
                {/* Dynamic fake bars based on range */}
                {[40, 70, 45, 90, 65, 85, 100].map((height, i) => {
                  const adjustedHeight = range === 1 ? height : range === 7 ? height * 1.5 : height * 2.5;
                  return (
                    <View key={i} style={styles.barWrap}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.min(adjustedHeight, 100)}%`,
                            backgroundColor: i === 6 ? colors.accent : colors.primary + "44",
                          },
                        ]}
                      />
                      <Text style={[typography.micro, { color: colors.textMuted, marginTop: spacing.sm }]}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>

          {/* Device Health */}
          <Card variant="accent" accentColor={colors.success} style={{ marginTop: spacing.xxl }}>
            <View style={styles.statusRow}>
              <View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Device Network</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 2 }]}>
                  {data.devices_online} / {data.devices_total} online
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: colors.success + "22" }]}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={[typography.caption, { color: colors.success, marginLeft: 6, fontWeight: "600" }]}>
                  {Math.round((data.devices_online / Math.max(data.devices_total, 1)) * 100)}% Health
                </Text>
              </View>
            </View>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function KPICard({ label, value, delta, hint, Icon, colors, highlight }: any) {
  const deltaColor = (delta ?? 0) >= 0 ? colors.success : colors.danger;
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => {}}
      // @ts-ignore - onHover is web only
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.kpiCard,
        {
          backgroundColor: colors.surface,
          borderColor: hovered ? colors.primary + "55" : colors.border,
          transform: [{ translateY: hovered ? -2 : 0 }],
        },
        hovered && elevation.md,
      ]}
    >
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIcon, { backgroundColor: highlight ? colors.accent + "22" : colors.primary + "15" }]}>
          <Icon color={highlight ? colors.accent : colors.primary} size={18} />
        </View>
        {typeof delta === "number" && (
          <View style={[styles.deltaPill, { backgroundColor: deltaColor + "15" }]}>
            {delta >= 0 && <ArrowUpRight color={deltaColor} size={12} />}
            <Text style={[typography.micro, { color: deltaColor, marginLeft: 2, fontWeight: "600" }]}>
              {delta.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[typography.numeric, { color: colors.textPrimary, marginTop: spacing.lg }]}>
        {value}
      </Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: spacing.xs, fontWeight: "600" }]}>
        {label}
      </Text>
      {hint && <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>{hint}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.md },
  
  rangeSelector: {
    flexDirection: "row",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 4,
  },
  rangeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    // @ts-ignore - web transition
    transition: "all 0.2s ease",
  },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  deltaPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill },

  chartSection: { marginTop: spacing.xxxl },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fakeChartRow: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: spacing.lg },
  barWrap: { alignItems: "center", justifyContent: "flex-end", height: "100%" },
  bar: { width: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6, transition: "height 0.5s ease" },

  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
});