import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Ticket as TicketIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StopPickerModal } from "../../../components/ui/StopPickerModal";
import { Stop } from "../../../lib/routes";
import { buyTicket } from "../../../lib/tickets";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeProvider";
import { radii, spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

const DEFAULT_ROUTE = "R-001";

export default function BuyTicketScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { colors } = useTheme();

  const [source, setSource] = useState<Stop | null>(null);
  const [dest, setDest] = useState<Stop | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showDest, setShowDest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBuy() {
    if (!source || !dest) return;
    setError(null);
    setSubmitting(true);
    try {
      const ticket = await buyTicket(DEFAULT_ROUTE, source.stop_id, dest.stop_id);
      await refreshUser(); // update wallet balance
      router.replace({
        pathname: "/ticket/show",
        params: { qr: ticket.qr_token, amount: ticket.amount_paid, expires: ticket.expires_at }
      });
    } catch (e: any) {
      setError(e?.detail || "Could not buy ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing.lg }]}>
            Buy Digital Ticket
          </Text>
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          <Pressable onPress={() => setShowSource(true)} style={styles.pickerRow}>
            <View style={[styles.icon, { backgroundColor: colors.success + "22" }]}>
              <MapPin color={colors.success} size={16} />
            </View>
            <View style={{ marginLeft: spacing.md }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>From</Text>
              <Text style={[typography.body, { color: source ? colors.textPrimary : colors.textMuted }]}>
                {source ? source.name : "Select starting stop"}
              </Text>
            </View>
          </Pressable>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable onPress={() => setShowDest(true)} style={styles.pickerRow}>
            <View style={[styles.icon, { backgroundColor: colors.danger + "22" }]}>
              <MapPin color={colors.danger} size={16} />
            </View>
            <View style={{ marginLeft: spacing.md }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>To</Text>
              <Text style={[typography.body, { color: dest ? colors.textPrimary : colors.textMuted }]}>
                {dest ? dest.name : "Select destination"}
              </Text>
            </View>
          </Pressable>
        </Card>

        {error && <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>}

        <View style={{ marginTop: spacing.xxxl }}>
          <Button
            label="Pay from Wallet"
            onPress={onBuy}
            loading={submitting}
            disabled={!source || !dest || source.stop_id === dest.stop_id}
            size="lg"
            icon={<TicketIcon color="#fff" size={18} />}
          />
        </View>
      </ScrollView>

      <StopPickerModal visible={showSource} title="From" onClose={() => setShowSource(false)} onSelect={(s) => { setSource(s); setShowSource(false); }} />
      <StopPickerModal visible={showDest} title="To" onClose={() => setShowDest(false)} onSelect={(s) => { setDest(s); setShowDest(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.xl },
  header: { flexDirection: "row", alignItems: "center" },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginVertical: spacing.xs, marginLeft: 48 },
});