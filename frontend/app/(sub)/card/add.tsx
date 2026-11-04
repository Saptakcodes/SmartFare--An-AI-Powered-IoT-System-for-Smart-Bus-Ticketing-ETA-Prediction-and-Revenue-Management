import { useRouter } from "expo-router";
import { ArrowLeft, ScanLine, Info } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { linkCard } from "../../../lib/cards";
import { useAuth } from "../../../contexts/AuthContext"; // Added
import { useTheme } from "../../../theme/ThemeProvider";
import { radii, spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth(); // Added user and refreshUser

  const [epc, setEpc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function normalize(v: string) {
    return v
      .replace(/[^0-9A-Fa-f]/g, "")
      .toUpperCase()
      .slice(0, 32);
  }

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    const cleaned = epc.trim();
    if (cleaned.length < 8) {
      setError("Card UID looks too short");
      return;
    }

    if (user && user.balance < 50) {
      Alert.alert("Insufficient Balance", "You need at least ₹50 in your wallet to pay the refundable security deposit.");
      return;
    }

    setSubmitting(true);
    try {
      const card = await linkCard(cleaned);
      await refreshUser(); // Refresh wallet balance after ₹50 deduction
      setSuccess(`Card ${card.rfid_id} linked successfully`);
      setTimeout(() => router.replace("/card"), 1500);
    } catch (e: any) {
      setError(e?.detail || "Could not link card");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <ArrowLeft color={colors.textPrimary} size={22} />
            </Pressable>
            <Text
              style={[
                typography.h2,
                { color: colors.textPrimary, marginLeft: spacing.lg },
              ]}
            >
              Link Card
            </Text>
          </View>

          <View style={styles.body}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <ScanLine color={colors.primary} size={32} />
            </View>

            <Text
              style={[
                typography.h2,
                {
                  color: colors.textPrimary,
                  marginTop: spacing.xl,
                  textAlign: "center",
                },
              ]}
            >
              Add a Transit Card
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: spacing.sm,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              Scan the QR code or type the UID printed on the back of your card.
            </Text>

            {/* SECURITY DEPOSIT WARNING BANNER */}
            <View style={{ backgroundColor: '#e3f2fd', padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center' }}>
              <Info color="#0d47a1" size={24} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>₹50 Refundable Deposit</Text>
                <Text style={{ color: '#0d47a1', fontSize: 12, marginTop: 2 }}>
                  A one-time security deposit of ₹50 will be deducted from your wallet. This is fully refunded if you unlink the card.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/card/scan")}
              style={({ pressed }) => [
                styles.scanBtn, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1 
                }
              ]}
            >
              <ScanLine color={colors.accent} size={20} />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: spacing.sm, fontWeight: "600" }]}>
                Scan QR Code
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[typography.caption, { color: colors.textMuted, marginHorizontal: spacing.md, fontWeight: "600" }]}>
                OR ENTER MANUALLY
              </Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <TextInput
              label="Card UID"
              value={epc}
              onChangeText={(t) => setEpc(normalize(t))}
              placeholder="E2001234ABCD"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!submitting}
              style={{ textAlign: "center", letterSpacing: 4, fontSize: 20 }}
            />

            {error ? (
              <Text style={[typography.bodySm, { color: colors.danger, textAlign: "center", marginTop: spacing.lg }]}>
                {error}
              </Text>
            ) : null}
            {success ? (
              <Text style={[typography.bodySm, { color: colors.success, textAlign: "center", marginTop: spacing.lg }]}>
                {success}
              </Text>
            ) : null}

            <View style={{ height: spacing.xxl }} />

            <Button
              label={user && user.balance < 50 ? "Insufficient Balance (Need ₹50)" : "Pay ₹50 Deposit & Link"}
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting || (user ? user.balance < 50 : true)}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center" },
  body: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 440,
    paddingTop: spacing.xxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
  },
});