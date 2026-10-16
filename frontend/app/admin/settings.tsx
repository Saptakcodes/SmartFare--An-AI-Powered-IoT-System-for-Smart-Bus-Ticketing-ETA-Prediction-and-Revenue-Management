import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "../../components/ui/Card";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <Text style={[typography.h1, { color: colors.textPrimary }]}>
        Settings
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.xs },
        ]}
      >
        Admin users, audit log, API keys
      </Text>

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Coming soon — admin user management, audit log, and API keys.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
});