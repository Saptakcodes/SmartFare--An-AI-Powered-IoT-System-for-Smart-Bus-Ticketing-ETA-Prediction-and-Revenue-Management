import { useRouter } from "expo-router";
import {
  ArrowDownUp,
  ArrowRight,
  Bus,
  Clock,
  Flame,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react-native";
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
import { elevation, radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Sample frequent stops — will come from backend later
const POPULAR_STOP_IDS = [
  "STP-KOL-001",
  "STP-KOL-002",
  "STP-KOL-003",
  "STP-KOL-004",
  "STP-KOL-005",
];

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

  const canSearch = source && destination && source.stop_id !== destination.stop_id;

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

      {/* Picker card */}
      <Card style={{ marginTop: spacing.xl, position: "relative" }}>
        {/* From */}
        <Pressable
          onPress={() => setShowSourcePicker(true)}
          style={({ pressed }) => [
            styles.pickerRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View
            style={[
              styles.iconDot,
              { backgroundColor: colors.success + "22" },
            ]}
          >
            <MapPin color={colors.success} size={16} />
          </View>
          <View style={styles.pickerText}>
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
                  fontWeight: source ? "600" : "400",
                },
              ]}
            >
              {source ? source.name : "Select a stop"}
            </Text>
          </View>
          <ArrowRight color={colors.textMuted} size={16} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* To */}
        <Pressable
          onPress={() => setShowDestPicker(true)}
          style={({ pressed }) => [
            styles.pickerRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View
            style={[styles.iconDot, { backgroundColor: colors.danger + "22" }]}
          >
            <MapPin color={colors.danger} size={16} />
          </View>
          <View style={styles.pickerText}>
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
                  fontWeight: destination ? "600" : "400",
                },
              ]}
            >
              {destination ? destination.name : "Select a stop"}
            </Text>
          </View>
          <ArrowRight color={colors.textMuted} size={16} />
        </Pressable>

        {/* Swap button */}
        <Pressable
          onPress={swap}
          disabled={!source && !destination}
          style={[
            styles.swapButton,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          <ArrowDownUp color={colors.accent} size={16} />
        </Pressable>
      </Card>

      {/* Action buttons */}
      <View style={{ height: spacing.lg }} />
      <Button
        label="Search routes"
        onPress={onSearch}
        loading={searching}
        disabled={!canSearch}
        size="lg"
      />
      {(source || destination) && !searching ? (
        <>
          <View style={{ height: spacing.sm }} />
          <Button label="Reset" variant="ghost" onPress={reset} />
        </>
      ) : null}

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

      {/* Popular stops before searching */}
      {!results && !source && !destination ? (
        <View style={{ marginTop: spacing.xxl }}>
          <View style={styles.sectionHeader}>
            <Flame color={colors.accent} size={14} />
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginLeft: spacing.sm },
              ]}
            >
              Popular stops
            </Text>
          </View>

          <View style={styles.popularGrid}>
            {["Esplanade", "Park Street", "Rabindra Sadan", "Kalighat"].map(
              (name, i) => (
                <Pressable
                  key={name}
                  onPress={() => setShowSourcePicker(true)}
                  style={[
                    styles.popularChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Star color={colors.accent} size={12} />
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textPrimary, marginLeft: 6 },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>
      ) : null}

      {/* Results */}
      {results !== null ? (
        <View style={{ marginTop: spacing.xxl }}>
          <View style={styles.sectionHeader}>
            <Sparkles color={colors.accent} size={14} />
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginLeft: spacing.sm },
              ]}
            >
              {results.length === 0
                ? "No routes found"
                : `${results.length} ${
                    results.length === 1 ? "route" : "routes"
                  } available`}
            </Text>
          </View>

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
            results.map((r, idx) => (
              <RouteResultCard
                key={r.route_id}
                result={r}
                index={idx}
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
      ) : null}

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
  index,
  onPress,
}: {
  result: RouteSearchResult;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  // Placeholder metrics — will come from ETA/analytics endpoint later
  const eta = 3 + index * 4;
  const fare = 10 + index * 4;
  const stops = result.stops_count;
  const isFastest = index === 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { marginTop: spacing.md, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <Card style={elevation.sm}>
        {/* Header row */}
        <View style={styles.routeHeader}>
          <View
            style={[
              styles.routeBadge,
              { backgroundColor: colors.primary + "1A" },
            ]}
          >
            <Bus color={colors.primary} size={12} />
            <Text
              style={[
                typography.micro,
                { color: colors.primary, marginLeft: 4, fontWeight: "700" },
              ]}
            >
              {result.route_id}
            </Text>
          </View>

          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.textPrimary,
                marginLeft: spacing.md,
                flex: 1,
                fontWeight: "600",
              },
            ]}
            numberOfLines={1}
          >
            {result.name}
          </Text>

          {isFastest ? (
            <View
              style={[
                styles.fastestPill,
                { backgroundColor: colors.success + "1A" },
              ]}
            >
              <Sparkles color={colors.success} size={10} />
              <Text
                style={[
                  typography.micro,
                  { color: colors.success, marginLeft: 3, fontWeight: "700" },
                ]}
              >
                FASTEST
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stops row */}
        <View style={styles.routeStopsRow}>
          <View style={styles.stopColumn}>
            <Text
              style={[typography.micro, { color: colors.textSecondary }]}
            >
              From
            </Text>
            <Text
              style={[
                typography.bodySm,
                { color: colors.textPrimary, marginTop: 2, fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {result.source_stop_name}
            </Text>
          </View>
          <View
            style={[styles.routeLine, { backgroundColor: colors.border }]}
          />
          <View style={styles.stopColumn}>
            <Text
              style={[typography.micro, { color: colors.textSecondary }]}
            >
              To
            </Text>
            <Text
              style={[
                typography.bodySm,
                { color: colors.textPrimary, marginTop: 2, fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {result.destination_stop_name}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={colors.accent} size={12} />
            <Text
              style={[
                typography.micro,
                { color: colors.textSecondary, marginLeft: 4 },
              ]}
            >
              ~{eta} min
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Text
            style={[
              typography.micro,
              { color: colors.textSecondary, marginLeft: 6 },
            ]}
          >
            {stops} stops
          </Text>
          <View style={{ flex: 1 }} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.textPrimary, fontWeight: "700" },
            ]}
          >
            ₹{fare.toFixed(0)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  iconDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerText: { marginLeft: spacing.md, flex: 1 },
  divider: { height: 1, marginVertical: spacing.xs, marginLeft: 52 },
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
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  popularChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  routeHeader: { flexDirection: "row", alignItems: "center" },
  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  fastestPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  routeStopsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  stopColumn: { flex: 1 },
  routeLine: { width: 24, height: 1, marginHorizontal: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
    marginLeft: 8,
  },
});