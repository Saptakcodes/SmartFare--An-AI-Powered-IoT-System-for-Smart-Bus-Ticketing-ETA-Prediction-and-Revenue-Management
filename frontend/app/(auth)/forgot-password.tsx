import { Link, useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
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

import { AuthBackground } from "../../components/ui/AuthBackground";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { ApiError } from "../../lib/api";
import * as authApi from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      setInfo(res.message);
      setTimeout(() => {
        router.push({
          pathname: "/reset-password",
          params: { email: email.trim().toLowerCase() },
        });
      }, 1200);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail : "Could not send reset code";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthBackground>
      <SafeAreaView style={styles.flex}>
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
              <Pressable
                onPress={() => router.back()}
                style={styles.back}
                hitSlop={10}
              >
                <ArrowLeft color={colors.textPrimary} size={22} />
              </Pressable>

              <Text style={[typography.h1, { color: colors.textPrimary }]}>
                Forgot password
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    marginTop: spacing.sm,
                    marginBottom: spacing.xxl,
                  },
                ]}
              >
                Enter the email associated with your account. We'll send a
                6-digit code to reset your password.
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!submitting}
                leftIcon={<Mail color={colors.textMuted} size={18} />}
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
              {info ? (
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
                  {info}
                </Text>
              ) : null}

              <View style={{ height: spacing.xxl }} />

              <Button
                label="Send reset code"
                onPress={onSubmit}
                loading={submitting}
                size="lg"
              />

              <View style={styles.footer}>
                <Text
                  style={[typography.body, { color: colors.textSecondary }]}
                >
                  Remembered it?{" "}
                </Text>
                <Link href="/login">
                  <Text
                    style={[typography.bodyMedium, { color: colors.accent }]}
                  >
                    Sign in
                  </Text>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
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
  back: { marginBottom: spacing.xl },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
});