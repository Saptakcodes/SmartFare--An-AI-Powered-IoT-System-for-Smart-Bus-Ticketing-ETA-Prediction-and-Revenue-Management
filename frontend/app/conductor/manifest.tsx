import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CreditCard, RefreshCw, Ticket, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTripPassengers, TripPassenger } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function PassengerManifestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  // Default to the current trip if passed, otherwise show empty
  const tripId = (params.trip_id as string) || "WBTC00-20261102-001";
  
  const [passengers, setPassengers] = useState<TripPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getTripPassengers(tripId);
      setPassengers(data);
    } catch (e) {
      console.log("Failed to load manifest", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => loadData(), 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <View style={{ marginLeft: spacing.md }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Passenger Manifest</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Trip: {tripId}</Text>
          </View>
        </View>
        
        <Pressable onPress={() => loadData(true)} disabled={refreshing} style={{ padding: 8 }}>
          <RefreshCw color={colors.accent} size={20} className={refreshing ? "animate-spin" : ""} />
        </Pressable>
      </View>

      {/* STATS BAR */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface }]}>
        <Users color={colors.accent} size={20} />
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: 8, fontWeight: "bold" }]}>
          {passengers.length} Passengers Onboard
        </Text>
      </View>

      {/* PASSENGER LIST */}
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={passengers}
          keyExtractor={(item) => item.journey_id}
          contentContainerStyle={{ padding: spacing.xl }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Users color={colors.textMuted} size={48} />
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>No passengers onboard yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "bold" }]} numberOfLines={1}>
                    {item.user_email}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                    Boarded at: {item.boarding_stop_name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Time: {new Date(item.started_at).toLocaleTimeString()}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  {/* PAYMENT BADGE */}
                  <View style={[
                    styles.badge, 
                    { backgroundColor: item.is_physical_card ? colors.accent + "20" : colors.success + "20" }
                  ]}>
                    {item.is_physical_card ? (
                      <><CreditCard color={colors.accent} size={12} /><Text style={[styles.badgeText, { color: colors.accent }]}>RFID</Text></>
                    ) : (
                      <><Ticket color={colors.success} size={12} /><Text style={[styles.badgeText, { color: colors.success }]}>QR CODE</Text></>
                    )}
                  </View>
                  
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
                    Paid: ₹{item.fare_collected.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1 },
  statsBar: { flexDirection: "row", alignItems: "center", padding: spacing.lg, marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: radii.md },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold", marginLeft: 4 },
});