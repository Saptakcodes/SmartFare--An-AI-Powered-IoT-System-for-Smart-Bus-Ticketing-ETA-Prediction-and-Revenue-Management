import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../../components/ui/Card";
import { useTheme } from "../../../theme/ThemeProvider";
import { spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function ShowTicketScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ qr: string; amount: string; expires: string }>();
  
  const [timeLeft, setTimeLeft] = useState("15:00");

  useEffect(() => {
    if (!params.expires) return;
    const end = new Date(params.expires).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
        return;
      }
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [params.expires]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/home")} hitSlop={10}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Card style={{ alignItems: "center", padding: spacing.xxxl }}>
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xl }]}>
            Show to Conductor
          </Text>
          
          <View style={[styles.qrWrap, { borderColor: colors.border, backgroundColor: "#fff", padding: spacing.lg }]}>
            {params.qr ? (
              <QRCode value={params.qr} size={240} color="#000" backgroundColor="#fff" />
            ) : null}
          </View>

          <View style={[styles.timer, { backgroundColor: colors.warning + "22" }]}>
            <Clock color={colors.warning} size={16} />
            <Text style={[typography.numericSm, { color: colors.warning, marginLeft: spacing.sm }]}>
              Valid for {timeLeft}
            </Text>
          </View>

          <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: spacing.xl, textAlign: "center" }]}>
            Amount Paid: ₹{params.amount}
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { padding: spacing.xl },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  qrWrap: { borderRadius: 16, borderWidth: 1 },
  timer: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 99, marginTop: spacing.xxl },
});