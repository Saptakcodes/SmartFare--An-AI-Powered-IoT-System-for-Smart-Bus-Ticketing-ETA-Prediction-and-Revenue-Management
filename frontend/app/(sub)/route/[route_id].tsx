import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
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
              { color: colors.textPrimary, marginLeft: spacing.lg },
            ]}
          >
            {route?.name || "Route"}
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
            {route.stops.map((s) => (
              <View key={s.stop_id} style={styles.stopRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: colors.accent, marginTop: 6 },
                  ]}
                />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {s.name}
                  </Text>
                  <Text
                    style={[
                      typography.micro,
                      { color: colors.textMuted, marginTop: 2 },
                    ]}
                  >
                    Stop {s.seq} · {s.stop_id}
                  </Text>
                </View>
              </View>
            ))}
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
  stopRow: { flexDirection: "row", paddingVertical: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
