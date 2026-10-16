import { useRouter } from "expo-router";
import { ArrowDownUp, Clock, MapPin, Users } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { StopPickerModal } from "../../components/ui/StopPickerModal";
import {
  RouteSearchResult,
  Stop,
  searchRoutes,
} from "../../lib/routes";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [source, setSource] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  const [results, setResults] = useState<RouteSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    if (!source || !destination) return;
    setError(null);
    setSearching(true);
    try {
      const res = await searchRoutes(source.stop_id, destination.stop_id);
      setResults(res);
    } catch (e: any) {
      setError(e?.detail || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function swap() {
    const s = source;
    setSource(destination);
    setDestination(s);
    setResults(null);
  }

  function reset() {
    setSource(null);
    setDestination(null);
    setResults(null);
    setError(null);
  }

  return (
    <Screen>
      <Text style={[typography.h1, { color: colors.textPrimary }]}>
        Plan your trip
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.xs },
        ]}
      >
        Pick where you're starting and where you're going
      </Text>

      {/* Pickers card */}
      <Card style={{ marginTop: spacing.xl }}>
        <Pressable
          onPress={() => setShowSourcePicker(true)}
          style={styles.field}
        >
          <View
            style={[
              styles.iconDot,
              { backgroundColor: colors.success + "22" },
            ]}
          >
            <MapPin color={colors.success} size={16} />
          </View>
          <View style={styles.fieldText}>
            <Text
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              From
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: source ? colors.textPrimary : colors.textMuted,
                  marginTop: 2,
                },
              ]}
            >
              {source ? source.name : "Select a stop"}
            </Text>
          </View>
        </Pressable>

        <View
          style={[styles.divider, { backgroundColor: colors.border }]}
        />

        <Pressable
          onPress={() => setShowDestPicker(true)}
          style={styles.field}
        >
          <View
            style={[
              styles.iconDot,
              { backgroundColor: colors.danger + "22" },
            ]}
          >
            <MapPin color={colors.danger} size={16} />
          </View>
          <View style={styles.fieldText}>
            <Text
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              To
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: destination ? colors.textPrimary : colors.textMuted,
                  marginTop: 2,
                },
              ]}
            >
              {destination ? destination.name : "Select a stop"}
            </Text>
          </View>
        </Pressable>

        {/* Swap button */}
        <Pressable
          onPress={swap}
          disabled={!source && !destination}
          style={[
            styles.swapButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <ArrowDownUp color={colors.accent} size={16} />
        </Pressable>
      </Card>

      {/* Search / Reset buttons */}
      <View style={{ height: spacing.lg }} />
      <Button
        label="Search routes"
        onPress={onSearch}
        loading={searching}
        disabled={!source || !destination}
        size="lg"
      />
      {(source || destination) && (
        <>
          <View style={{ height: spacing.md }} />
          <Button label="Reset" variant="ghost" onPress={reset} />
        </>
      )}

      {/* Error */}
      {error ? (
        <Text
          style={[
            typography.bodySm,
            {
              color: colors.danger,
              textAlign: "center",
              marginTop: spacing.lg,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}

      {/* Results */}
      {results !== null && (
        <View style={{ marginTop: spacing.xxl }}>
          <Text
            style={[typography.h3, { color: colors.textPrimary }]}
          >
            {results.length === 0
              ? "No routes found"
              : `${results.length} ${
                  results.length === 1 ? "route" : "routes"
                } available`}
          </Text>

          {results.length === 0 ? (
            <Card style={{ marginTop: spacing.lg }}>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, textAlign: "center" },
                ]}
              >
                No direct route connects these stops yet. Try a different
                source or destination.
              </Text>
            </Card>
          ) : (
            results.map((r) => (
              <RouteResultCard
                key={r.route_id}
                result={r}
                onPress={() =>
                  router.push({
                    pathname: "/route/[route_id]",
                    params: { route_id: r.route_id },
                  })
                }
              />
            ))
          )}
        </View>
      )}

      {/* Pickers */}
      <StopPickerModal
        visible={showSourcePicker}
        title="Choose starting stop"
        onClose={() => setShowSourcePicker(false)}
        onSelect={(s) => {
          setSource(s);
          setShowSourcePicker(false);
          setResults(null);
        }}
      />
      <StopPickerModal
        visible={showDestPicker}
        title="Choose destination"
        onClose={() => setShowDestPicker(false)}
        onSelect={(s) => {
          setDestination(s);
          setShowDestPicker(false);
          setResults(null);
        }}
      />
    </Screen>
  );
}

function RouteResultCard({
  result,
  onPress,
}: {
  result: RouteSearchResult;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ marginTop: spacing.lg }}>
      <Card>
        <View style={styles.routeHeader}>
          <View
            style={[
              styles.routeBadge,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Text style={[typography.bodyMedium, { color: colors.primary }]}>
              {result.route_id}
            </Text>
          </View>
          <Text
            style={[
              typography.h3,
              { color: colors.textPrimary, marginLeft: spacing.md, flex: 1 },
            ]}
          >
            {result.name}
          </Text>
        </View>

        <View style={{ height: spacing.lg }} />

        <View style={styles.routeStopsRow}>
          <View style={styles.stopColumn}>
            <Text
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              From
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textPrimary, marginTop: 2 },
              ]}
            >
              {result.source_stop_name}
            </Text>
          </View>
          <View
            style={[styles.routeLine, { backgroundColor: colors.border }]}
          />
          <View style={styles.stopColumn}>
            <Text
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              To
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textPrimary, marginTop: 2 },
              ]}
            >
              {result.destination_stop_name}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users color={colors.textMuted} size={14} />
            <Text
              style={[
                typography.caption,
                { color: colors.textMuted, marginLeft: 6 },
              ]}
            >
              {result.stops_count} stops
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock color={colors.textMuted} size={14} />
            <Text
              style={[
                typography.caption,
                { color: colors.textMuted, marginLeft: 6 },
              ]}
            >
              Tap for timetable
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldText: { marginLeft: spacing.md, flex: 1 },
  divider: { height: 1, marginVertical: spacing.xs, marginLeft: 48 },
  swapButton: {
    position: "absolute",
    right: spacing.lg,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  routeHeader: { flexDirection: "row", alignItems: "center" },
  routeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  routeStopsRow: { flexDirection: "row", alignItems: "center" },
  stopColumn: { flex: 1 },
  routeLine: { width: 24, height: 1, marginHorizontal: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.lg },
  metaItem: { flexDirection: "row", alignItems: "center" },
});