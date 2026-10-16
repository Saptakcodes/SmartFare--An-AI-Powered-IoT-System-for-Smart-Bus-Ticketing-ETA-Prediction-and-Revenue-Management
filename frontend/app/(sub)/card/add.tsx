import { useRouter } from "expo-router";
import { ArrowLeft, CreditCard } from "lucide-react-native";
import { useState } from "react";
import {
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
import { useTheme } from "../../../theme/ThemeProvider";
import { spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();

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

    setSubmitting(true);
    try {
      const card = await linkCard(cleaned);
      setSuccess(`Card ${card.rfid_id} linked successfully`);
      setTimeout(() => router.replace("/card"), 1200);
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
              Add Card
            </Text>
          </View>

          <View style={styles.body}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <CreditCard color={colors.primary} size={32} />
            </View>

            <Text
              style={[
                typography.h3,
                {
                  color: colors.textPrimary,
                  marginTop: spacing.xl,
                  textAlign: "center",
                },
              ]}
            >
              Enter your card UID
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: spacing.sm,
                  marginBottom: spacing.xxl,
                },
              ]}
            >
              You'll find the UID printed on the back of your SmartFare card.
              It's usually 8 to 24 characters.
            </Text>

            <TextInput
              label="Card UID"
              value={epc}
              onChangeText={(t) => setEpc(normalize(t))}
              placeholder="E2001234ABCD"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!submitting}
              leftIcon={<CreditCard color={colors.textMuted} size={18} />}
            />

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
            {success ? (
              <Text
                style={[
                  typography.bodySm,
                  {
                    color: colors.success,
                    textAlign: "center",
                    marginTop: spacing.lg,
                  },
                ]}
              >
                {success}
              </Text>
            ) : null}

            <View style={{ height: spacing.xxl }} />

            <Button
              label="Link Card"
              onPress={onSubmit}
              loading={submitting}
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
});