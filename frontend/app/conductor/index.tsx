import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ScanLine, LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { validateTicket } from "../../lib/admin";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function ConductorScannerScreen() {
  const { admin, signOut } = useAdminAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [tripId, setTripId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // If not logged in, show message instead of infinite redirect
  if (!admin) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl }]}>
        <Text style={[typography.h3, { color: colors.textPrimary, textAlign: "center" }]}>
          Admin Login Required
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.md }]}>
          Please log in to the Admin Dashboard first, then return to this screen.
        </Text>
        <Pressable 
          onPress={() => router.push("/admin/login")} 
          style={{ marginTop: spacing.xl, backgroundColor: colors.accent, padding: spacing.md, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Go to Admin Login</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Camera Required</Text>
          <Pressable onPress={requestPermission} style={{ marginTop: spacing.xl }}>
             <Text style={[typography.body, { color: colors.accent }]}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleScan({ data }: { data: string }) {
    if (scanned || !tripId) return;
    setScanned(true);
    setStatus("Validating...");

    try {
      await validateTicket(data, tripId);
      setStatus("✅ Ticket Validated!");
      setTimeout(() => { setScanned(false); setStatus(null); }, 3000);
    } catch (e: any) {
      setStatus(`❌ ${e?.detail || "Invalid Ticket"}`);
      setTimeout(() => { setScanned(false); setStatus(null); }, 3000);
    }
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={[typography.h3, { color: "#fff" }]}>Conductor Mode</Text>
          <Pressable onPress={() => { signOut(); router.replace("/admin/login"); }}>
            <LogOut color="#fff" size={20} />
          </Pressable>
        </View>

        <View style={styles.center}>
           {!scanned && <ScanLine color="#fff" size={150} strokeWidth={1} />}
           {status && (
             <View style={styles.statusBox}>
               <Text style={[typography.h2, { color: "#fff", textAlign: "center" }]}>{status}</Text>
             </View>
           )}
        </View>

        <View style={styles.bottomBar}>
          <Text style={[typography.caption, { color: "#fff" }]}>Active Trip ID (Required)</Text>
          <TextInput
            placeholder="e.g. b827eb-20261017-001"
            placeholderTextColor="#aaaaaa"
            value={tripId}
            onChangeText={setTripId}
            style={styles.input}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "space-between", padding: spacing.xl },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  bottomBar: { backgroundColor: "rgba(0,0,0,0.8)", padding: spacing.xl, borderRadius: 16, marginBottom: 20 },
  input: { backgroundColor: "#222", color: "#fff", padding: spacing.md, borderRadius: 8, marginTop: spacing.sm },
  statusBox: { position: "absolute", backgroundColor: "rgba(0,0,0,0.9)", padding: spacing.xl, borderRadius: 16 },
});