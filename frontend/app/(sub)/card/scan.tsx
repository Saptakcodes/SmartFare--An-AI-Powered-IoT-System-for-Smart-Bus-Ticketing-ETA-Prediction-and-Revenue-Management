import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ArrowLeft, ScanLine } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/ui/Button";
import { linkCard } from "../../../lib/cards";
import { useTheme } from "../../../theme/ThemeProvider";
import { radii, spacing } from "../../../theme/tokens";
import { typography } from "../../../theme/typography";

export default function ScanCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Text style={[typography.h3, { color: colors.textPrimary, textAlign: "center" }]}>
            Camera permission required
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }]}>
            We need camera access to scan your SmartFare card.
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            <Button label="Grant Permission" onPress={requestPermission} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    try {
      // Assume the QR code contains the EPC directly, or a JSON object
      let epc = data;
      if (data.startsWith("{")) {
        const parsed = JSON.parse(data);
        epc = parsed.epc || parsed.uid || data;
      }
      
      const card = await linkCard(epc);
      alert(`Card ${card.rfid_id} linked successfully!`);
      router.replace("/card");
    } catch (e: any) {
      alert(e?.detail || "Could not link card. Try again.");
      setScanned(false);
    }
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </Pressable>

        <View style={styles.scanWindow}>
          <ScanLine color={colors.accent} size={120} strokeWidth={1} />
        </View>

        <View style={styles.bottomPrompt}>
          <Text style={[typography.h3, { color: "#fff", textAlign: "center" }]}>
            Align QR Code
          </Text>
          <Text style={[typography.bodySm, { color: "#ffffffcc", textAlign: "center", marginTop: spacing.xs }]}>
            Point your camera at the QR code on the back of your SmartFare card.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xxl },
  overlay: { flex: 1, justifyContent: "space-between", padding: spacing.xl },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  scanWindow: {
    alignSelf: "center",
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPrompt: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.xxl,
  },
});