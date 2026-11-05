import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  CheckCircle,
  Clock,
  CreditCard,
  Plus,
  Wallet as WalletIcon,
  X,
  XCircle,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CountUp } from "../../components/ui/CountUp";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Transaction, 
  listTransactions, 
  createMockOrder, 
  verifyMockPayment, 
  MockOrder 
} from "../../lib/wallet";
import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";
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

  // Group transactions by date
  const grouped = groupTransactionsByDate(transactions || []);

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
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Wallet
          </Text>
          <Pressable
            onPress={() => router.push("/card")}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <WalletIcon color={colors.textSecondary} size={18} />
          </Pressable>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={colors.brandGradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceTop}>
            <Text style={[typography.caption, { color: "#ffffffcc" }]}>
              Available balance
            </Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={[typography.micro, { color: "#fff" }]}>Active</Text>
            </View>
          </View>
          <Text style={[typography.display, { color: "#fff", marginTop: spacing.sm }]}>
            ₹ <CountUp value={Number(user?.balance ?? 0)} />
          </Text>
          
          <View style={styles.balanceActions}>
            <Pressable
              onPress={() => setShowTopUp(true)}
              style={({ pressed }) => [
                styles.topUpBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Plus color="#0a2540" size={16} />
              <Text style={[typography.bodySm, { color: "#0a2540", marginLeft: 4, fontWeight: "700" }]}>
                Top up
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Clock color={colors.textSecondary} size={14} />
          <Text style={[typography.h3, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
            Recent transactions
          </Text>
        </View>

        {error ? (
          <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.md }]}>
            {error}
          </Text>
        ) : loading ? (
          <TransactionSkeleton colors={colors} />
        ) : transactions?.length === 0 ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
              No transactions yet. Top up to get started.
            </Text>
          </Card>
        ) : (
          Object.entries(grouped).map(([dateLabel, txns]) => (
            <View key={dateLabel} style={{ marginTop: spacing.lg }}>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, marginLeft: 4 }]}>
                {dateLabel}
              </Text>
              {txns.map((txn) => (
                <TransactionRow key={txn.transaction_id} txn={txn} />
              ))}
            </View>
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

// ==========================================
// Sub-components
// ==========================================

function TransactionRow({ txn }: { txn: Transaction }) {
  const { colors } = useTheme();
  const isCredit = txn.type === "TOPUP" || txn.type === "REFUND";
  
  const iconColor = isCredit ? colors.success : colors.primary;
  const amountColor = isCredit ? colors.success : colors.textPrimary;
  const sign = isCredit ? "+" : "-";

  const labelMap: Record<Transaction["type"], string> = {
    TOPUP: "Wallet top up",
    FARE_ENTRY: "Boarding hold",
    FARE_UPDATE: "Fare settled",
    FARE_FINAL: "Final fare",
    REFUND: "Refund",
  };

  const Icon = isCredit ? ArrowDownLeft : txn.type.includes("FARE") ? Bus : ArrowUpRight;
  const timeStr = new Date(txn.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.txnRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.txnIcon, { backgroundColor: iconColor + "15" }]}>
        <Icon color={iconColor} size={18} />
      </View>

      <View style={styles.txnBody}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "600" }]}>
          {labelMap[txn.type] || txn.type}
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
          {timeStr}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={[typography.numericSm, { color: amountColor }]}>
          {sign}₹{Math.abs(txn.amount).toFixed(2)}
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
          Bal: ₹{Number(txn.balance_after ?? 0).toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

function TransactionSkeleton({ colors }: { colors: any }) {
  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.txnRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.txnIcon, { backgroundColor: colors.elevated }]} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={{ width: 120, height: 14, backgroundColor: colors.elevated, borderRadius: 4 }} />
            <View style={{ width: 60, height: 10, backgroundColor: colors.elevated, borderRadius: 4, marginTop: 6 }} />
          </View>
          <View style={{ width: 60, height: 16, backgroundColor: colors.elevated, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

// ==========================================
// NEW TWO-STEP MOCK GATEWAY MODAL
// ==========================================

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
  
  // Mock Gateway States
  const [step, setStep] = useState<1 | 2>(1); // 1 = Enter Amount, 2 = Checkout
  const [order, setOrder] = useState<MockOrder | null>(null);

  const presets = [100, 200, 500, 1000];

  async function onCreateOrder() {
    setError(null);
    const value = parseFloat(amount);
    if (isNaN(value) || value < 10) {
      setError("Minimum top up is ₹10");
      return;
    }
    
    setSubmitting(true);
    try {
      const mockOrder = await createMockOrder(value);
      setOrder(mockOrder);
      setStep(2);
    } catch (e: any) {
      setError(e?.detail || "Failed to initialize checkout");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulatePayment(success: boolean) {
    if (!order) return;
    
    if (!success) {
      // Cancel flow: reset and close
      setStep(1);
      setOrder(null);
      setAmount("100");
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      const amountInRupees = order.amount / 100; 
      await verifyMockPayment(order.id, amountInRupees);
      
      // Reset state and trigger success
      setStep(1);
      setOrder(null);
      setAmount("100");
      onSuccess(); 
    } catch (e: any) {
      setError(e?.detail || "Payment verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setStep(1);
    setOrder(null);
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={styles.modalBackdrop} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {step === 1 ? "Add money" : "Checkout"}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10} disabled={submitting}>
              <X color={colors.textSecondary} size={24} />
            </Pressable>
          </View>

          {/* STEP 1: Enter Amount */}
          {step === 1 && (
            <>
              <View style={styles.amountInputWrap}>
                <Text style={[typography.display, { color: colors.textPrimary }]}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={[typography.display, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  editable={!submitting}
                />
              </View>

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
                          backgroundColor: active ? colors.accent + "15" : "transparent",
                        },
                      ]}
                    >
                      <Text style={[typography.bodyMedium, { color: active ? colors.accent : colors.textPrimary }]}>
                        ₹{p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg, textAlign: "center" }]}>
                  {error}
                </Text>
              ) : null}

              <View style={{ flex: 1 }} />

              <Button
                label={`Proceed to Pay ₹${amount || 0}`}
                onPress={onCreateOrder}
                loading={submitting}
                size="lg"
              />
            </>
          )}

          {/* STEP 2: Mock Gateway Checkout */}
          {step === 2 && (
            <>
              <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
                <View style={{ backgroundColor: colors.accent + "22", padding: 16, borderRadius: 40, marginBottom: 16 }}>
                  <CreditCard color={colors.accent} size={32} />
                </View>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Mock Gateway</Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>
                  SmartFare Test Checkout
                </Text>
              </View>

              <View style={[styles.receiptBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>Amount to pay</Text>
                <Text style={[typography.display, { color: colors.textPrimary, marginTop: 8 }]}>
                  ₹ {order ? order.amount / 100 : 0}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 16, textAlign: "center" }]} numberOfLines={1}>
                  Order ID: {order?.id}
                </Text>
              </View>

              {error ? (
                <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg, textAlign: "center" }]}>
                  {error}
                </Text>
              ) : null}

              <View style={{ flex: 1 }} />

              <View style={{ gap: spacing.md }}>
                <Pressable
                  onPress={() => handleSimulatePayment(true)}
                  disabled={submitting}
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <CheckCircle color="#fff" size={20} />
                      <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 16 }}>Simulate Success</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => handleSimulatePayment(false)}
                  disabled={submitting}
                  style={[styles.actionBtn, { backgroundColor: colors.danger + "15", borderWidth: 1, borderColor: colors.danger }]}
                >
                  <XCircle color={colors.danger} size={20} />
                  <Text style={{ color: colors.danger, fontWeight: "bold", marginLeft: 8, fontSize: 16 }}>Cancel Payment</Text>
                </Pressable>
              </View>
            </>
          )}

          <SafeAreaView edges={["bottom"]} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ==========================================
// Helpers
// ==========================================

function groupTransactionsByDate(txns: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  txns.forEach((t) => {
    const d = new Date(t.created_at);
    let label = "";

    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });

  return groups;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2EE6A6",
    marginRight: 4,
  },
  balanceActions: {
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  topUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxxl,
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  txnBody: { flex: 1, marginLeft: spacing.md },
  
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    height: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
  },
  
  // Mock Gateway specific styles
  receiptBox: { 
    padding: spacing.xl, 
    borderRadius: radii.lg, 
    borderWidth: 1, 
    alignItems: "center",
    width: "100%"
  },
  actionBtn: { 
    flexDirection: "row", 
    padding: spacing.lg, 
    borderRadius: radii.md, 
    alignItems: "center", 
    justifyContent: "center" 
  },
});