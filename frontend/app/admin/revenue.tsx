import { useFocusEffect } from "expo-router";
import { BarChart3, RefreshCw } from "lucide-react-native";
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
import { Revenue, getRevenue } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
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

  const maxRevenue = data
    ? Math.max(1, ...data.by_route.map((r) => r.revenue))
    : 1;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Revenue
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            Fare collection performance
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
                  backgroundColor: active
                    ? colors.primary + "22"
                    : "transparent",
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: active ? colors.primary : colors.textSecondary },
                ]}
              >
                Last {d} days
              </Text>
            </Pressable>
          );
        })}
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
      ) : data ? (
        <>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <Card style={{ flex: 1 }}>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                Total revenue
              </Text>
              <Text
                style={[
                  typography.numeric,
                  { color: colors.textPrimary, marginTop: spacing.sm },
                ]}
              >
                ₹ {data.total_revenue.toFixed(0)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                Transactions
              </Text>
              <Text
                style={[
                  typography.numeric,
                  { color: colors.textPrimary, marginTop: spacing.sm },
                ]}
              >
                {data.total_transactions}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                Average fare
              </Text>
              <Text
                style={[
                  typography.numeric,
                  { color: colors.textPrimary, marginTop: spacing.sm },
                ]}
              >
                ₹ {data.average_fare.toFixed(0)}
              </Text>
            </Card>
          </View>

          {/* By route */}
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, marginTop: spacing.xxl },
            ]}
          >
            Revenue by route
          </Text>

          {data.by_route.length === 0 ? (
            <Card style={{ marginTop: spacing.lg }}>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, textAlign: "center" },
                ]}
              >
                No routes yet.
              </Text>
            </Card>
          ) : (
            data.by_route.map((r) => {
              const pct = (r.revenue / maxRevenue) * 100;
              return (
                <Card key={r.route_id} style={{ marginTop: spacing.md }}>
                  <View style={styles.routeRow}>
                    <View
                      style={[
                        styles.routeBadge,
                        { backgroundColor: colors.primary + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodyMedium,
                          { color: colors.primary },
                        ]}
                      >
                        {r.route_id}
                      </Text>
                    </View>
                    <Text
                      style={[
                        typography.bodyMedium,
                        {
                          color: colors.textPrimary,
                          marginLeft: spacing.md,
                          flex: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {r.route_name}
                    </Text>
                    <Text
                      style={[
                        typography.numericSm,
                        { color: colors.textPrimary },
                      ]}
                    >
                      ₹{r.revenue.toFixed(0)}
                    </Text>
                  </View>
                  {/* Bar */}
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: colors.elevated },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      typography.micro,
                      {
                        color: colors.textMuted,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    {r.journeys} {r.journeys === 1 ? "journey" : "journeys"}
                  </Text>
                </Card>
              );
            })
          )}
        </>
      ) : null}
    </ScrollView>
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
  pillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  rangePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  center: { alignItems: "center", marginTop: spacing.xxxl },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  routeRow: { flexDirection: "row", alignItems: "center" },
  routeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
});