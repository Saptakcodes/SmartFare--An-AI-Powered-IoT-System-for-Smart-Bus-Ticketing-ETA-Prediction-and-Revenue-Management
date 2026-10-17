import { BlurView } from "expo-blur";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, Mail, Lock, User } from "lucide-react-native";
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
import { Checkbox } from "../../components/ui/Checkbox";
import { TextInput } from "../../components/ui/TextInput";
import { ApiError } from "../../lib/api";
import * as authApi from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register(
        email.trim().toLowerCase(),
        fullName.trim(),
        password
      );
      router.push({
        pathname: "/verify-otp",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Registration failed";
      setError(msg);
    } finally {
      setSubmitting(false);
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
              <Pressable
                onPress={() => router.back()}
                style={styles.back}
                hitSlop={10}
              >
                <ArrowLeft color={colors.textPrimary} size={22} />
              </Pressable>

              <Text style={[typography.h1, { color: colors.textPrimary }]}>
                Create your account
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
                ]}
              >
                Join SmartFare and start riding smarter
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
                <TextInput
                  label="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Doe"
                  editable={!submitting}
                  leftIcon={<User color={colors.textMuted} size={18} />}
                />
                <View style={{ height: spacing.lg }} />

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
                <View style={{ height: spacing.lg }} />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureToggle
                  editable={!submitting}
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                />

                <View style={{ height: spacing.lg }} />

                <Checkbox
                  checked={agreeTerms}
                  onChange={setAgreeTerms}
                  label="I agree to the Terms & Conditions"
                />

                {error ? (
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.danger, textAlign: "center", marginTop: spacing.md },
                    ]}
                  >
                    {error}
                  </Text>
                ) : null}

                <View style={{ height: spacing.xl }} />

                <Button
                  label="Create account"
                  onPress={onSubmit}
                  loading={submitting}
                  size="lg"
                />
              </GlassPanel>

              <View style={styles.footer}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>
                  Already have an account?{" "}
                </Text>
                <Link href="/login">
                  <Text style={[typography.bodyMedium, { color: colors.accent }]}>
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
  back: { marginBottom: spacing.lg },
  glassPanel: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xxl,
  },
});