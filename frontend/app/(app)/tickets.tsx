import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRight, Ticket as TicketIcon, XCircle } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/ui/Card";
import { DigitalTicketRecord, listMyTickets } from "../../lib/tickets";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function MyTicketsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tickets, setTickets] = useState<DigitalTicketRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTickets(await listMyTickets());
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>My Tickets</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Your digital QR passes
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : !tickets || tickets.length === 0 ? (
          <View style={styles.empty}>
            <TicketIcon color={colors.textMuted} size={48} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.lg }]}>No tickets yet</Text>
            <Pressable onPress={() => router.push("/ticket/buy")} style={{ marginTop: spacing.xl }}>
              <Text style={[typography.bodyMedium, { color: colors.accent }]}>Buy your first ticket →</Text>
            </Pressable>
          </View>
        ) : (
          tickets.map((t) => {
            const isActive = t.status === "ACTIVE";
            const isExpired = t.status === "EXPIRED";
            const date = new Date(t.created_at);

            return (
              <Pressable
                key={t.ticket_id}
                disabled={!isActive}
                onPress={() => router.push({ pathname: "/ticket/show", params: { qr: t.qr_token, amount: t.amount_paid.toString(), expires: t.expires_at } })}
                style={{ marginTop: spacing.md }}
              >
                <Card style={{ 
                  borderColor: isActive ? colors.accent + "55" : colors.border,
                  opacity: isActive ? 1 : 0.6 // Dim inactive tickets
                }}>
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: isActive ? colors.accent + "15" : colors.surface }]}>
                      {isActive ? (
                        <TicketIcon color={colors.accent} size={20} />
                      ) : (
                        <XCircle color={colors.textMuted} size={20} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "600" }]}>
                        {isActive ? "Active Ticket" : isExpired ? "Expired Ticket" : "Used Ticket"}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                        {date.toLocaleDateString()} · ₹{t.amount_paid.toFixed(2)}
                      </Text>
                    </View>
                    {isActive && <ArrowRight color={colors.accent} size={18} />}
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.xl },
  empty: { alignItems: "center", marginTop: spacing.xxxl * 2 },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});