import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Ticket as TicketIcon, AlertTriangle, XCircle } from "lucide-react-native";
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

export default function BuyTicketScreen() {
  const router = useRouter();
  
  // FIX (Bug 9): Get route_id from params, fallback to R-001
  const { route_id } = useLocalSearchParams();
  const activeRoute = (route_id as string) || "R-001";

  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();

  const [source, setSource] = useState<Stop | null>(null);
  const [dest, setDest] = useState<Stop | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showDest, setShowDest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlocked = user ? user.balance < 0 : false;
  const isLowBalance = user ? user.balance >= 0 && user.balance < 50 : false;

  async function onBuy() {
    if (!source || !dest || isBlocked) return;
    setError(null);
    setSubmitting(true);
    try {
      // Use the dynamic route from params
      const ticket = await buyTicket(activeRoute, source.stop_id, dest.stop_id);
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

        {/* BALANCE WARNING BANNERS */}
        {isBlocked ? (
          <View style={{ backgroundColor: '#ffebee', padding: spacing.md, borderRadius: radii.md, marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' }}>
            <XCircle color="#c62828" size={24} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={{ color: '#c62828', fontWeight: 'bold' }}>🚫 Account Blocked</Text>
              <Text style={{ color: '#c62828', fontSize: 12, marginTop: 2 }}>
                Your balance is negative. Please top up your wallet to resume service.
              </Text>
            </View>
          </View>
        ) : isLowBalance ? (
          <View style={{ backgroundColor: '#fff3e0', padding: spacing.md, borderRadius: radii.md, marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffe0b2' }}>
            <AlertTriangle color="#ef6c00" size={24} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={{ color: '#ef6c00', fontWeight: 'bold' }}>⚠️ Low Balance Warning</Text>
              <Text style={{ color: '#ef6c00', fontSize: 12, marginTop: 2 }}>
                Your balance is ₹{user?.balance}. Maintain at least ₹50 to avoid card blocking.
              </Text>
            </View>
          </View>
        ) : null}

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
            label={isBlocked ? "Account Blocked - Top Up" : "Pay from Wallet"}
            onPress={onBuy}
            loading={submitting}
            disabled={!source || !dest || source.stop_id === dest.stop_id || isBlocked}
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