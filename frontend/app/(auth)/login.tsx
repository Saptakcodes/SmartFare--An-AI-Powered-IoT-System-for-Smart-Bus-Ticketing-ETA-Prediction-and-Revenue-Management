import { BlurView } from "expo-blur";
import { Link, useRouter } from "expo-router";
import { Mail, Lock } from "lucide-react-native";
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
import { Logo } from "../../components/ui/Logo";
import { TextInput } from "../../components/ui/TextInput";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/home");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Login failed";
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
              <View style={styles.header}>
                <Logo size="lg" />
                <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.xl }]}>
                  Welcome back
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  Sign in to continue your journey
                </Text>
              </View>

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
                  placeholder="Enter your password"
                  secureToggle
                  editable={!submitting}
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                />

                <View style={styles.rowBetween}>
                  <Checkbox
                    checked={rememberMe}
                    onChange={setRememberMe}
                    label="Remember me"
                  />
                  <Pressable
                    onPress={() => router.push("/forgot-password")}
                    disabled={submitting}
                  >
                    <Text style={[typography.bodySm, { color: colors.accent }]}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                {error ? (
                  <Text style={[typography.bodySm, { color: colors.danger, textAlign: "center", marginTop: spacing.md }]}>
                    {error}
                  </Text>
                ) : null}

                <View style={{ height: spacing.xl }} />

                <Button
                  label="Sign in"
                  onPress={onSubmit}
                  loading={submitting}
                  size="lg"
                />
              </GlassPanel>

              <View style={styles.footer}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>
                  Don't have an account?{" "}
                </Text>
                <Link href="/register">
                  <Text style={[typography.bodyMedium, { color: colors.accent }]}>
                    Register
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
  header: { marginBottom: spacing.xxl, alignItems: "flex-start" },
  glassPanel: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xl,
  },
});