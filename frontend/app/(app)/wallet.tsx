import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  Clock,
  Plus,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TextInput } from "../../components/ui/TextInput";
import { useAuth } from "../../contexts/AuthContext";
import { Transaction, listTransactions, topUp } from "../../lib/wallet";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function WalletScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTopUp, setShowTopUp] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTransactions();
      setTransactions(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>
          Wallet
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          Manage your balance and view transactions
        </Text>

        {/* Balance card */}
        <LinearGradient
          colors={colors.brandGradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceTop}>
            <WalletIcon color="#ffffffcc" size={20} />
            <Text style={[typography.caption, { color: "#ffffffcc" }]}>
              Available balance
            </Text>
          </View>
          <Text
            style={[typography.display, { color: "#fff", marginTop: spacing.md }]}
          >
            ₹ {Number(user?.balance ?? 0).toFixed(2)}
          </Text>
          <Pressable
            onPress={() => setShowTopUp(true)}
            style={styles.topUpBtn}
          >
            <Plus color="#fff" size={16} />
            <Text
              style={[
                typography.caption,
                { color: "#fff", marginLeft: 6, fontWeight: "600" },
              ]}
            >
              Top up
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Quick links */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push("/journeys")}
            style={[
              styles.quickTile,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Bus color={colors.accent} size={20} />
            <Text
              style={[
                typography.caption,
                { color: colors.textPrimary, marginTop: spacing.sm },
              ]}
            >
              Journey history
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/card")}
            style={[
              styles.quickTile,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <WalletIcon color={colors.accent} size={20} />
            <Text
              style={[
                typography.caption,
                { color: colors.textPrimary, marginTop: spacing.sm },
              ]}
            >
              My cards
            </Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, marginTop: spacing.xxl, marginBottom: spacing.lg },
          ]}
        >
          Recent transactions
        </Text>

        {error ? (
          <Text style={[typography.bodySm, { color: colors.danger }]}>
            {error}
          </Text>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !transactions || transactions.length === 0 ? (
          <Card>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: "center" },
              ]}
            >
              No transactions yet. Top up to get started.
            </Text>
          </Card>
        ) : (
          transactions.map((t) => (
            <TransactionRow key={t.transaction_id} txn={t} />
          ))
        )}
      </ScrollView>

      <TopUpModal
        visible={showTopUp}
        onClose={() => setShowTopUp(false)}
        onSuccess={async () => {
          setShowTopUp(false);
          await refreshUser();
          await load();
        }}
      />
    </SafeAreaView>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const { colors } = useTheme();
  const isCredit = txn.type === "TOPUP" || txn.type === "REFUND";
  const amountColor = isCredit ? colors.success : colors.textPrimary;
  const sign = isCredit ? "+" : "-";

  const labelMap: Record<Transaction["type"], string> = {
    TOPUP: "Wallet top up",
    FARE_ENTRY: "Boarding hold",
    FARE_UPDATE: "Fare update",
    FARE_FINAL: "Fare final",
    REFUND: "Refund",
  };

  const date = new Date(txn.created_at);
  const dateStr = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.txnRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.txnIcon,
          {
            backgroundColor: isCredit
              ? colors.success + "22"
              : colors.primary + "22",
          },
        ]}
      >
        {isCredit ? (
          <ArrowDownLeft color={colors.success} size={18} />
        ) : (
          <ArrowUpRight color={colors.primary} size={18} />
        )}
      </View>

      <View style={styles.txnBody}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          {labelMap[txn.type] || txn.type}
        </Text>
        <View style={styles.txnMetaRow}>
          <Clock color={colors.textMuted} size={11} />
          <Text
            style={[
              typography.micro,
              { color: colors.textMuted, marginLeft: 4 },
            ]}
          >
            {dateStr} · {timeStr}
          </Text>
        </View>
      </View>

      <Text style={[typography.numericSm, { color: amountColor }]}>
        {sign}₹{Math.abs(txn.amount).toFixed(2)}
      </Text>
    </View>
  );
}

function TopUpModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { colors } = useTheme();
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [50, 100, 200, 500];

  async function onSubmit() {
    setError(null);
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await topUp(value);
      setAmount("100");
      onSuccess();
    } catch (e: any) {
      setError(e?.detail || "Top up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            Top up wallet
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
            ]}
          >
            Add money to your SmartFare balance.
          </Text>

          <View style={styles.presetRow}>
            {presets.map((p) => {
              const active = amount === String(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => setAmount(String(p))}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active
                        ? colors.accent + "22"
                        : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: active ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    ₹{p}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.lg }} />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="100"
            editable={!submitting}
          />

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

          <View style={{ height: spacing.xl }} />

          <Button
            label={`Add ₹${amount || 0}`}
            onPress={onSubmit}
            loading={submitting}
            size="lg"
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={onClose}
            disabled={submitting}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  center: { alignItems: "center", paddingVertical: spacing.xxl },
  balanceCard: {
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  topUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  txnBody: { flex: 1, marginLeft: spacing.md },
  txnMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  presetRow: { flexDirection: "row", gap: spacing.sm },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
  },
});