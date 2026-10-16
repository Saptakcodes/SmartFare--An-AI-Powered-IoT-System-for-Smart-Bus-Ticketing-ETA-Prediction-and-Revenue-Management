import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { OTPInput } from "../../components/ui/OTPInput";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../lib/api";
import * as authApi from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const { colors } = useTheme();
  const { refreshUser } = useAuth();

  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function onVerify() {
    setError(null);
    setInfo(null);
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await authApi.verifyOtp(email, otp);
      await authApi.saveTokens(tokens);
      await refreshUser();
      router.replace("/home");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Verification failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await authApi.resendOtp(email);
      setInfo("A new code was sent to your email");
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Could not resend";
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  const resendDisabled = cooldown > 0 || resending;

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
                onPress={() => router.replace("/login")}
                style={styles.back}
                hitSlop={10}
              >
                <ArrowLeft color={colors.textPrimary} size={22} />
              </Pressable>

              <Text style={[typography.h1, { color: colors.textPrimary }]}>
                Verify your email
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
                We sent a 6-digit code to{"\n"}
                <Text
                  style={{ color: colors.textPrimary, fontWeight: "600" }}
                >
                  {email}
                </Text>
              </Text>

              <OTPInput value={otp} onChange={setOtp} autoFocus />

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
                label="Verify"
                onPress={onVerify}
                loading={submitting}
                size="lg"
              />

              <Pressable
                style={styles.resendRow}
                onPress={onResend}
                disabled={resendDisabled}
              >
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      color: resendDisabled ? colors.textMuted : colors.accent,
                    },
                  ]}
                >
                  {resending
                    ? "Sending..."
                    : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"}
                </Text>
              </Pressable>
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
  resendRow: {
    alignSelf: "center",
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
});