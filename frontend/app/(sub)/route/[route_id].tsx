import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Navigation } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../../components/ui/Card";
import { RouteDetail, getRouteDetail } from "../../../lib/routes";
import { useTheme } from "../../../theme/ThemeProvider";
import { spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function RouteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ route_id?: string }>();
  const route_id = typeof params.route_id === "string" ? params.route_id : "";

  const { colors } = useTheme();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRouteDetail(route_id);
        setRoute(data);
      } catch (e: any) {
        setError(e?.detail || "Could not load route");
      } finally {
        setLoading(false);
      }
    })();
  }, [route_id]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, marginLeft: spacing.lg, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {route?.name || "Route Details"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : error ? (
          <Text
            style={[
              typography.bodySm,
              { color: colors.danger, marginTop: spacing.xl },
            ]}
          >
            {error}
          </Text>
        ) : route ? (
          <Card style={{ marginTop: spacing.xl }}>
            {/* Summary Header */}
            <View style={styles.summaryRow}>
              <Navigation color={colors.accent} size={16} />
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.textSecondary, marginLeft: spacing.sm },
                ]}
              >
                {route.stops.length} stops on this route
              </Text>
            </View>

            {/* Subway-style Timeline */}
            <View style={{ marginTop: spacing.xl }}>
              {route.stops.map((s, index) => {
                const isFirst = index === 0;
                const isLast = index === route.stops.length - 1;

                return (
                  <View key={s.stop_id} style={styles.stopRow}>
                    {/* Timeline Graphic */}
                    <View style={styles.timelineCol}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isFirst
                              ? colors.success
                              : isLast
                              ? colors.danger
                              : colors.accent,
                            width: isFirst || isLast ? 12 : 8,
                            height: isFirst || isLast ? 12 : 8,
                            borderRadius: isFirst || isLast ? 6 : 4,
                          },
                        ]}
                      />
                      {!isLast && (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      )}
                    </View>

                    {/* Stop Info */}
                    <View
                      style={[
                        styles.stopInfo,
                        { paddingBottom: isLast ? 0 : spacing.xxl },
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodyMedium,
                          {
                            color:
                              isFirst || isLast
                                ? colors.textPrimary
                                : colors.textSecondary,
                            fontWeight: isFirst || isLast ? "700" : "500",
                          },
                        ]}
                      >
                        {s.name}
                      </Text>
                      <View style={styles.stopMeta}>
                        <MapPin color={colors.textMuted} size={10} />
                        <Text
                          style={[
                            typography.micro,
                            { color: colors.textMuted, marginLeft: 4 },
                          ]}
                        >
                          {s.stop_id} · Stop {s.seq}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", marginTop: spacing.xxxl },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  stopRow: { flexDirection: "row" },
  timelineCol: { width: 20, alignItems: "center" },
  dot: { marginTop: 4 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  stopInfo: { flex: 1, marginLeft: spacing.md },
  stopMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
});