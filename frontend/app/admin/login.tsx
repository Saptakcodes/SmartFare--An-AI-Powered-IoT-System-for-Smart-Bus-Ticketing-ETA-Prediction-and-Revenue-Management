import { useRouter } from "expo-router";
import { Lock, Mail, Shield } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { ApiError } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { signIn } = useAdminAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/admin");
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.detail : "Login failed";
      setError(msg);
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
          <View style={styles.inner}>
            <View
              style={[
                styles.shieldWrap,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Shield color={colors.accent} size={32} />
            </View>
            <Text
              style={[
                typography.h1,
                {
                  color: colors.textPrimary,
                  textAlign: "center",
                  marginTop: spacing.xl,
                },
              ]}
            >
              SmartFare Admin
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: spacing.xs,
                  marginBottom: spacing.xxxl,
                },
              ]}
            >
              Operator & administrator access only
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="admin@smartfare.local"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!submitting}
              leftIcon={<Mail color={colors.textMuted} size={18} />}
            />
            <View style={{ height: spacing.lg }} />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureToggle
              editable={!submitting}
              leftIcon={<Lock color={colors.textMuted} size={18} />}
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

            <View style={{ height: spacing.xxl }} />
            <Button
              label="Sign in"
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
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  inner: { width: "100%", maxWidth: 440, alignSelf: "center" },
  shieldWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});