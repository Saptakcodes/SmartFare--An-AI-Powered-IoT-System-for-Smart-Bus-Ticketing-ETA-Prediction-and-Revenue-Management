import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { unlinkCard } from "../../../lib/cards";
import { useTheme } from "../../../theme/ThemeProvider";
import { spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function CardDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rfid_id?: string }>();
  const rfid_id = typeof params.rfid_id === "string" ? params.rfid_id : "";

  const { colors } = useTheme();
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    const doRemove = async () => {
      setRemoving(true);
      try {
        await unlinkCard(rfid_id);
        router.replace("/card");
      } catch (e: any) {
        Alert.alert("Error", e?.detail || "Could not unlink card");
      } finally {
        setRemoving(false);
      }
    };

    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(
        "Remove this card from your account? You can add it back anytime."
      );
      if (ok) await doRemove();
      return;
    }

    Alert.alert(
      "Remove card?",
      "You can add it back anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: doRemove,
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
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
            Card details
          </Text>
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Card UID
          </Text>
          <Text
            style={[
              typography.h3,
              {
                color: colors.textPrimary,
                marginTop: 4,
                letterSpacing: 2,
              },
            ]}
          >
            {rfid_id}
          </Text>

          <View style={{ height: spacing.lg }} />

          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Status
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.success, marginTop: 4 },
            ]}
          >
            Active
          </Text>
        </Card>

        <Text
          style={[
            typography.bodySm,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.xxl,
              marginBottom: spacing.lg,
            },
          ]}
        >
          Removing a card unbinds it from your account. Your journeys and
          transactions stay in history.
        </Text>

        <Button
          label="Remove card"
          variant="danger"
          onPress={confirmRemove}
          loading={removing}
          icon={<Trash2 color="#fff" size={18} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center" },
});