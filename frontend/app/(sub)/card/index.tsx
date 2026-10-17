import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Nfc, Plus, ShieldAlert } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/ui/Button";
import { listCards, RFIDCard } from "../../../lib/cards";
import { useTheme } from "../../../theme/ThemeProvider";
import { radii, spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

function maskUid(uid: string): string {
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)} •••• •••• ${uid.slice(-4)}`;
}

export default function CardListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [cards, setCards] = useState<RFIDCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listCards();
      setCards(data);
    } catch (e: any) {
      setError(e?.detail || "Could not load cards");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const hasCards = cards && cards.length > 0;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
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
            My Cards
          </Text>
        </View>

        {error ? (
          <Text
            style={[
              typography.bodySm,
              { color: colors.danger, marginTop: spacing.lg },
            ]}
          >
            {error}
          </Text>
        ) : null}

        {!hasCards ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <ShieldAlert color={colors.primary} size={32} />
            </View>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginTop: spacing.xl },
              ]}
            >
              No cards linked yet
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
              Link your SmartFare UHF card to start riding
            </Text>
            <Button
              label="Add Card"
              onPress={() => router.push("/card/add")}
              icon={<Plus color="#fff" size={18} />}
            />
          </View>
        ) : (
          <>
            {cards!.map((card) => (
              <CardVisual key={card.rfid_id} card={card} />
            ))}
            <View style={{ height: spacing.xl }} />
            <Button
              label="Add another card"
              variant="secondary"
              onPress={() => router.push("/card/add")}
              icon={<Plus color={colors.textPrimary} size={18} />}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CardVisual({ card }: { card: RFIDCard }) {
  const { colors } = useTheme();
  const router = useRouter();

  const blocked = card.is_blocked;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/card/[rfid_id]",
          params: { rfid_id: card.rfid_id },
        })
      }
      style={({ pressed }) => [
        { marginTop: spacing.xl, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={
          blocked
            ? ["#3A3F52", "#1E2233"]
            : (colors.brandGradient as unknown as string[])
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardVisual}
      >
        <View style={styles.cardTop}>
          <Nfc color="#ffffffcc" size={28} />
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: blocked ? "#FF5C7A55" : "#2EE6A655",
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: blocked ? "#FF5C7A" : "#2EE6A6", fontWeight: "600" },
              ]}
            >
              {blocked ? "BLOCKED" : "ACTIVE"}
            </Text>
          </View>
        </View>

        <Text
          style={[
            typography.h2,
            {
              color: "#fff",
              marginTop: spacing.xxxl,
              letterSpacing: 2,
              fontVariant: ["tabular-nums"],
            },
          ]}
        >
          {maskUid(card.rfid_id)}
        </Text>

        <View style={styles.cardBottom}>
          <View>
            <Text style={[typography.micro, { color: "#ffffffaa" }]}>CARDHOLDER</Text>
            <Text style={[typography.bodySm, { color: "#fff", fontWeight: "600" }]}>
              SmartFare User
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[typography.micro, { color: "#ffffffaa" }]}>ISSUED</Text>
            <Text style={[typography.bodySm, { color: "#fff" }]}>
              {new Date(card.issued_at).toLocaleDateString(undefined, { month: "2-digit", year: "2-digit" })}
            </Text>
          </View>
        </View>
        
        {/* Decorative Circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center" },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xxxl * 2,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  cardVisual: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    aspectRatio: 1.6,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 2,
  },
  deco1: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  deco2: {
    position: "absolute",
    left: -30,
    bottom: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});