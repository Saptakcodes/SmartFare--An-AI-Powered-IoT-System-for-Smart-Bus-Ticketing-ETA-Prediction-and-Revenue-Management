import { useFocusEffect } from "expo-router";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  DollarSign,
  RefreshCw,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { Revenue, getRevenue } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminRevenueScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getRevenue(days);
      setData(d);
    } catch (e: any) {
      setError(e?.detail || "Could not load revenue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

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

  const maxRevenue = data ? Math.max(1, ...data.by_route.map((r) => r.revenue)) : 1;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Revenue</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Fare collection performance
          </Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={10} disabled={refreshing} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {refreshing ? <ActivityIndicator size="small" color={colors.accent} /> : <RefreshCw color={colors.textSecondary} size={18} />}
        </Pressable>
      </View>

      {/* Day selector */}
      <View style={styles.pillsRow}>
        {[7, 30, 90].map((d) => {
          const active = days === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDays(d)}
              style={[
                styles.rangePill,
                {
                  backgroundColor: active ? colors.primary + "22" : "transparent",
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[typography.caption, { color: active ? colors.primary : colors.textSecondary, fontWeight: active ? "600" : "500" }]}>
                Last {d} days
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      {data ? (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <SummaryCard label="Total revenue" value={`₹ ${data.total_revenue.toFixed(0)}`} Icon={DollarSign} colors={colors} highlight />
            <SummaryCard label="Transactions" value={String(data.total_transactions)} Icon={CreditCard} colors={colors} />
            <SummaryCard label="Average fare" value={`₹ ${data.average_fare.toFixed(0)}`} Icon={BarChart3} colors={colors} />
          </View>

          {/* Fake Chart Visual */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Revenue Trend</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Last {days} days</Text>
            </View>
            <Card style={{ marginTop: spacing.md, height: 200, overflow: "hidden", justifyContent: "flex-end", padding: 0 }}>
              <View style={styles.chartBars}>
                {[30, 45, 60, 40, 75, 90, 85, 100, 80, 95, 70, 100].map((h, i) => (
                  <View key={i} style={[styles.chartBar, { height: `${h}%`, backgroundColor: i === 11 ? colors.accent : colors.primary + "22" }]} />
                ))}
              </View>
            </Card>
          </View>

          {/* Revenue By Route */}
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xxxl }]}>
            Revenue by route
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            {data.by_route.length === 0 ? (
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
                  No routes yet.
                </Text>
              </Card>
            ) : (
              data.by_route.map((r) => {
                const pct = (r.revenue / maxRevenue) * 100;
                return (
                  <Card key={r.route_id} style={{ marginTop: spacing.md }}>
                    <View style={styles.routeRow}>
                      <View style={[styles.routeBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: "700" }]}>
                          {r.route_id}
                        </Text>
                      </View>
                      <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: spacing.md, flex: 1, fontWeight: "600" }]} numberOfLines={1}>
                        {r.route_name}
                      </Text>
                      <Text style={[typography.numericSm, { color: colors.textPrimary }]}>
                        ₹{r.revenue.toFixed(0)}
                      </Text>
                    </View>
                    
                    <View style={[styles.barTrack, { backgroundColor: colors.elevated }]}>
                      <View style={[styles.barFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: colors.accent }]} />
                    </View>
                    
                    <View style={styles.routeFooter}>
                      <Text style={[typography.micro, { color: colors.textMuted }]}>
                        {r.journeys} {r.journeys === 1 ? "journey" : "journeys"}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <ArrowUpRight color={colors.success} size={10} />
                        <Text style={[typography.micro, { color: colors.success, marginLeft: 2 }]}>Trending</Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function SummaryCard({ label, value, Icon, colors, highlight }: any) {
  return (
    <Card style={styles.summaryCard}>
      <View style={[styles.iconWrap, { backgroundColor: highlight ? colors.accent + "22" : colors.primary + "15" }]}>
        <Icon color={highlight ? colors.accent : colors.primary} size={20} />
      </View>
      <Text style={[typography.numeric, { color: colors.textPrimary, marginTop: spacing.lg }]}>{value}</Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: spacing.xs }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxl, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  iconBtn: { width: 38, height: 38, borderRadius: radii.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  
  pillsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  rangePill: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1 },

  summaryRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xl, flexWrap: "wrap" },
  summaryCard: { flex: 1, minWidth: 200, borderRadius: radii.xl },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

  chartSection: { marginTop: spacing.xxxl },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartBars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: "100%", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 4 },
  chartBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 10 },

  routeRow: { flexDirection: "row", alignItems: "center" },
  routeBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.pill },
  barTrack: { height: 8, borderRadius: 4, marginTop: spacing.lg, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  routeFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
});