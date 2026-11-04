import { useRouter } from "expo-router";
import { ArrowLeft, Bus, ShieldAlert, StopCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActiveTrip, forceEndTrip, getActiveTrips, getDevices, DeviceHealth } from "../../lib/admin";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminTripsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [t, d] = await Promise.all([getActiveTrips(), getDevices()]);
      setTrips(t);
      setDevices(d);
    } catch (e: any) {
      Alert.alert("Error", e?.detail || "Could not fetch trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleEndTrip(tripId: string) {
    Alert.alert(
      "Force End Trip",
      "Are you sure you want to end this trip? All active passenger journeys will be closed immediately.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Trip", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await forceEndTrip(tripId);
              Alert.alert("Success", `${res.message} ${res.journeys_closed} journeys closed.`);
              loadData(); // refresh list
            } catch (e: any) {
              Alert.alert("Error", e?.detail || "Failed to end trip");
            }
          }
        }
      ]
    );
  }

  function getDeviceStatus(busId: string) {
    const dev = devices.find(d => d.bus_id === busId);
    if (!dev) return { text: "No Device", color: colors.textMuted };
    if (dev.status === "online") return { text: "Online", color: colors.success };
    if (dev.status === "stale") return { text: "Stale (No GPS)", color: colors.warning };
    return { text: "Offline", color: colors.danger };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing.lg }]}>
          Trip Management
        </Text>
        <Pressable onPress={loadData} style={{ marginLeft: 'auto' }}>
          <Text style={{ color: colors.accent, fontWeight: "bold" }}>Refresh</Text>
        </Pressable>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.trip_id}
        contentContainerStyle={{ padding: spacing.xl }}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxl }}>
            {loading ? "Loading trips..." : "No active trips right now."}
          </Text>
        }
        renderItem={({ item }) => {
          const devStatus = getDeviceStatus(item.bus_id);
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Bus color={colors.accent} size={20} />
                  <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
                    {item.bus_id}
                  </Text>
                </View>
                <View style={{ backgroundColor: devStatus.color + "22", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ color: devStatus.color, fontSize: 10, fontWeight: "bold" }}>{devStatus.text}</Text>
                </View>
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Trip ID: {item.trip_id}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Route: {item.route_id}</Text>
              
              <Pressable 
                onPress={() => handleEndTrip(item.trip_id)}
                style={[styles.endBtn, { backgroundColor: colors.danger + "15", borderColor: colors.danger }]}
              >
                <StopCircle color={colors.danger} size={16} />
                <Text style={{ color: colors.danger, fontWeight: "bold", marginLeft: 6 }}>Force End Trip</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: "#222" },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  endBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, padding: spacing.md, borderRadius: radii.md, marginTop: spacing.lg },
});