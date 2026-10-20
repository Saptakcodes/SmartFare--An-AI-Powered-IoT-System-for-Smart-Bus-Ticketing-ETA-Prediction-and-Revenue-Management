import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ScanLine, LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Correct imports for the conductor folder
import { validateTicket } from "../../lib/admin";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { API_URL } from "../../lib/api";

export default function ConductorScannerScreen() {
  const { admin, signOut } = useAdminAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [tripId, setTripId] = useState("b827eb-20261017-001");
  const [manualToken, setManualToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  if (!admin) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl }]}>
        <Text style={[typography.h3, { color: colors.textPrimary, textAlign: "center" }]}>
          Admin Login Required
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

  async function handleScan(data: string) {
    if (!tripId) {
      setStatus("❌ Please enter Trip ID first!");
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    
    if (scanned || !data) return;
    
    setScanned(true);
    setStatus("Validating...");

    try {
      await validateTicket(data, tripId);
      setStatus("✅ Ticket Validated!");
      setTimeout(() => { setScanned(false); setStatus(null); setManualToken(""); }, 3000);
    } catch (e: any) {
      console.log("VALIDATION ERROR:", e); 
      setStatus(`❌ ${e?.detail || e?.message || "Network Error"}`);
      setTimeout(() => { setScanned(false); setStatus(null); }, 4000);
    }
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => handleScan(data)}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={[typography.h3, { color: "#fff" }]}>Conductor Mode</Text>
          
          <Pressable 
            onPress={() => { signOut(); router.replace("/admin/login"); }}
            style={{ backgroundColor: "#ff4444", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
          >
            <LogOut color="#fff" size={16} />
            <Text style={{ color: "#fff", marginLeft: 6, fontWeight: "bold" }}>LOGOUT</Text>
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

          <Text style={[typography.caption, { color: "#fff", marginTop: 10 }]}>Manual QR Token (For Testing)</Text>
          <TextInput
            placeholder="Paste QR token here"
            placeholderTextColor="#aaaaaa"
            value={manualToken}
            onChangeText={setManualToken}
            style={styles.input}
          />
          <Pressable
            onPress={() => handleScan(manualToken)}
            style={{ backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, marginTop: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Validate Manually</Text>
          </Pressable>

          <Text style={{ color: "#aaa", fontSize: 10, marginTop: 10, textAlign: "center" }}>
            Connecting to: {API_URL}
          </Text>
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