import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock } from "lucide-react-native";
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
import { OTPInput } from "../../components/ui/OTPInput";
import { TextInput } from "../../components/ui/TextInput";
import { ApiError } from "../../lib/api";
import * as authApi from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const { colors, isDark } = useTheme();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setInfo(null);

    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(email, otp, newPassword);
      setInfo(res.message);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Reset failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    try {
      await authApi.forgotPassword(email);
      setInfo("A new code was sent to your email");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Could not resend";
      setError(msg);
    }
  }

  const GlassPanel = Platform.OS === "web" ? View : BlurView;
  const glassProps = Platform.OS === "web" ? {} : { intensity: isDark ? 50 : 70, tint: isDark ? "dark" : "light" };

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
              <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
                <ArrowLeft color={colors.textPrimary} size={22} />
              </Pressable>

              <Text style={[typography.h1, { color: colors.textPrimary }]}>
                Reset password
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xxl },
                ]}
              >
                Enter the code we sent to{"\n"}
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                  {email}
                </Text>
              </Text>

              <GlassPanel
                {...glassProps}
                style={[
                  styles.glassPanel,
                  {
                    borderColor: colors.border,
                    backgroundColor: Platform.OS === "web" ? colors.surface + "CC" : "transparent",
                  },
                ]}
              >
                <OTPInput value={otp} onChange={setOtp} />

                <View style={{ height: spacing.xl }} />

                <TextInput
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  secureToggle
                  editable={!submitting}
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                />

                <View style={{ height: spacing.lg }} />

                <TextInput
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  secureToggle
                  editable={!submitting}
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                />

                {error ? (
                  <Text style={[typography.bodySm, { color: colors.danger, textAlign: "center", marginTop: spacing.lg }]}>
                    {error}
                  </Text>
                ) : null}
                {info ? (
                  <Text style={[typography.bodySm, { color: colors.success, textAlign: "center", marginTop: spacing.lg }]}>
                    {info}
                  </Text>
                ) : null}

                <View style={{ height: spacing.xl }} />

                <Button
                  label="Reset password"
                  onPress={onSubmit}
                  loading={submitting}
                  size="lg"
                />
              </GlassPanel>

              <Pressable style={styles.resendRow} onPress={onResend}>
                <Text style={[typography.bodyMedium, { color: colors.accent }]}>
                  Resend code
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
  glassPanel: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  resendRow: {
    alignSelf: "center",
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
});