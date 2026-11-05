import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  Lock,
  Plus,
  ShieldCheck,
  Smartphone,
  Wallet as WalletIcon,
  X,
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

  const grouped = groupTransactionsByDate(transactions || []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
// REALISTIC MOCK GATEWAY MODAL
// ==========================================

type Step = "amount" | "method" | "processing" | "success";

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
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const presets = [100, 200, 500, 1000];

  async function handleProceedToPay() {
    setError(null);
    const value = parseFloat(amount);
    if (isNaN(value) || value < 10) return setError("Minimum top up is ₹10");
    
    try {
      const mockOrder = await createMockOrder(value);
      setOrder(mockOrder);
      setStep("method");
    } catch (e: any) {
      setError(e?.detail || "Failed to initialize checkout");
    }
  }

  function handleSimulateGateway() {
    setStep("processing");
    
    // Simulate a 2-second bank processing time
    setTimeout(async () => {
      try {
        const fakePaymentId = `pay_${Math.random().toString(36).substring(2, 16)}`;
        setPaymentId(fakePaymentId);
        
        await verifyMockPayment(order!.id, fakePaymentId, order!.amount / 100);
        setStep("success");
      } catch (e: any) {
        setError(e?.detail || "Payment failed");
        setStep("method");
      }
    }, 2000);
  }

  function handleClose() {
    if (step === "processing") return; // Prevent closing during processing
    
    // Reset state
    setTimeout(() => {
      setStep("amount");
      setAmount("100");
      setOrder(null);
      setPaymentId(null);
      setError(null);
    }, 300);
    
    if (step === "success") {
      onSuccess(); // Trigger wallet refresh
    } else {
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Lock color={colors.success} size={16} />
              <Text style={[typography.caption, { color: colors.success, marginLeft: 6, fontWeight: "bold" }]}>
                SECURE CHECKOUT
              </Text>
            </View>
            {step !== "processing" && (
              <Pressable onPress={handleClose} hitSlop={10}>
                <X color={colors.textSecondary} size={24} />
              </Pressable>
            )}
          </View>

          {/* STEP 1: Enter Amount */}
          {step === "amount" && (
            <>
              <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xl }]}>
                Add money to wallet
              </Text>
              
              <View style={styles.amountInputWrap}>
                <Text style={[typography.display, { color: colors.textPrimary }]}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={[typography.display, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.presetRow}>
                {presets.map((p) => {
                  const active = amount === String(p);
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setAmount(String(p))}
                      style={[styles.presetChip, {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accent + "15" : "transparent",
                      }]}
                    >
                      <Text style={[typography.bodyMedium, { color: active ? colors.accent : colors.textPrimary }]}>
                        ₹{p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error && <Text style={[typography.bodySm, { color: colors.danger, marginTop: spacing.lg, textAlign: "center" }]}>{error}</Text>}

              <View style={{ flex: 1 }} />
              <Button label="Proceed to Pay" onPress={handleProceedToPay} size="lg" />
            </>
          )}

          {/* STEP 2: Select Payment Method */}
          {step === "method" && (
            <>
              <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Paying</Text>
                <Text style={[typography.display, { color: colors.textPrimary, marginVertical: 8 }]}>
                  ₹{order ? order.amount / 100 : 0}
                </Text>
              </View>

              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                Select Payment Method
              </Text>

              <View style={{ gap: spacing.md }}>
                <PaymentOption 
                  icon={<Smartphone color={colors.accent} size={24} />}
                  title="UPI (GPay, PhonePe)"
                  subtitle="Instant transfer"
                  selected={method === "upi"}
                  onPress={() => setMethod("upi")}
                />
                <PaymentOption 
                  icon={<CreditCard color={colors.accent} size={24} />}
                  title="Credit / Debit Card"
                  subtitle="Visa, Mastercard, RuPay"
                  selected={method === "card"}
                  onPress={() => setMethod("card")}
                />
                <PaymentOption 
                  icon={<Landmark color={colors.accent} size={24} />}
                  title="Netbanking"
                  subtitle="All major banks supported"
                  selected={method === "netbanking"}
                  onPress={() => setMethod("netbanking")}
                />
              </View>

              <View style={{ flex: 1 }} />
              <Button label={`Pay ₹${order ? order.amount / 100 : 0}`} onPress={handleSimulateGateway} size="lg" />
            </>
          )}

          {/* STEP 3: Processing */}
          {step === "processing" && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.xl }]}>
                Processing Payment...
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }]}>
                Please do not press back or close the app.{"\n"}Contacting your bank securely.
              </Text>
            </View>
          )}

          {/* STEP 4: Success Receipt */}
          {step === "success" && (
            <View style={{ flex: 1 }}>
              <View style={{ alignItems: "center", marginTop: spacing.xl }}>
                <View style={{ backgroundColor: colors.success + "22", padding: 20, borderRadius: 50, marginBottom: 16 }}>
                  <CheckCircle2 color={colors.success} size={48} />
                </View>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>Payment Successful</Text>
                <Text style={[typography.display, { color: colors.textPrimary, marginTop: spacing.md }]}>
                  ₹{order ? order.amount / 100 : 0}
                </Text>
              </View>

              <View style={[styles.receiptBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.xxl }]}>
                <View style={styles.receiptRow}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Paid via</Text>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "bold", textTransform: "uppercase" }]}>{method}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Order ID</Text>
                  <Text style={[typography.caption, { color: colors.textPrimary }]}>{order?.id}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Payment ID</Text>
                  <Text style={[typography.caption, { color: colors.textPrimary }]}>{paymentId}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
                  <ShieldCheck color={colors.success} size={14} />
                  <Text style={[typography.micro, { color: colors.success, marginLeft: 4 }]}>Verified by SmartFare Secure</Text>
                </View>
              </View>

              <View style={{ flex: 1 }} />
              <Button label="Back to Wallet" onPress={handleClose} size="lg" />
            </View>
          )}

          <SafeAreaView edges={["bottom"]} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PaymentOption({ icon, title, subtitle, selected, onPress }: any) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.lg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent + "0A" : "transparent",
      }}
    >
      <View style={{ width: 40, alignItems: "center" }}>{icon}</View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: "bold" }]}>{title}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
      </View>
      <View style={{
        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
        borderColor: selected ? colors.accent : colors.textMuted,
        alignItems: "center", justifyContent: "center"
      }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
      </View>
    </Pressable>
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
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
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
  
  // Receipt styles
  receiptBox: { 
    padding: spacing.xl, 
    borderRadius: radii.lg, 
    borderWidth: 1, 
    gap: spacing.md 
  },
  receiptRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
});