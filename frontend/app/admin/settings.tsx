import { useRouter } from "expo-router";
import {
  CheckCircle2,
  Database,
  Globe,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Server,
  Shield,
  Sun,
  User as UserIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

type ThemeMode = "light" | "dark" | "system";

export default function AdminSettingsScreen() {
  const { admin, signOut } = useAdminAuth();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();

  // Profile State
  const [editName, setEditName] = useState(admin?.full_name || "");
  const [editEmail, setEditEmail] = useState(admin?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin Creation State
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");

  async function handleSignOut() {
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of Admin Console?")) {
        await signOut();
        router.replace("/admin/login");
      }
      return;
    }
    await signOut();
    router.replace("/admin/login");
  }

  function onCreateAdmin() {
    alert(`Mock: Would create admin ${newEmail}`);
    setShowCreate(false);
    setNewEmail("");
    setNewName("");
    setNewPass("");
  }

  function onSaveProfile() {
    setSavingProfile(true);
    setTimeout(() => {
      alert("Mock: Profile details updated successfully.");
      setSavingProfile(false);
    }, 800);
  }

  if (!admin) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Text style={[typography.h1, { color: colors.textPrimary }]}>Settings</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Manage your admin account and system preferences
      </Text>

      {/* Admin Profile Header */}
      <Text style={styles.sectionTitle}>YOUR ACCOUNT</Text>
      <Card style={{ marginTop: spacing.sm }}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[typography.h3, { color: colors.primary, fontWeight: "700" }]}>
              {admin.email.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>{admin.full_name}</Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>{admin.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.success + "15" }]}>
                <Shield color={colors.success} size={10} />
                <Text style={[typography.micro, { color: colors.success, marginLeft: 4, fontWeight: "600" }]}>
                  {admin.role.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Profile Details (Email/Name Edit) */}
      <Text style={styles.sectionTitle}>PROFILE DETAILS</Text>
      <Card style={{ marginTop: spacing.sm }}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>Full Name</Text>
        <TextInput
          value={editName}
          onChangeText={setEditName}
          style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }]}
        />
        
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4, marginTop: spacing.md }]}>Email Address</Text>
        <TextInput
          value={editEmail}
          onChangeText={setEditEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }]}
        />
        
        <View style={{ marginTop: spacing.lg, alignItems: "flex-end" }}>
          <Button 
            label="Save Profile" 
            onPress={onSaveProfile} 
            loading={savingProfile}
            variant="secondary"
          />
        </View>
      </Card>

      {/* Preferences (Dark Mode) */}
      <Text style={styles.sectionTitle}>PREFERENCES</Text>
      <Card style={{ marginTop: spacing.sm }}>
        <View style={styles.themeRow}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
            Appearance
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.elevated }]}>
            <ThemeChip active={mode === "light"} onPress={() => setMode("light")} Icon={Sun} colors={colors} />
            <ThemeChip active={mode === "dark"} onPress={() => setMode("dark")} Icon={Moon} colors={colors} />
            <ThemeChip active={mode === "system"} onPress={() => setMode("system")} Icon={Monitor} colors={colors} />
          </View>
        </View>
      </Card>

      {/* System Status */}
      <Text style={styles.sectionTitle}>SYSTEM STATUS</Text>
      <Card padded={false} style={{ marginTop: spacing.sm }}>
        <StatusRow icon={<Server color={colors.accent} size={18} />} label="Backend API" value="Connected" isOnline />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatusRow icon={<Database color={colors.accent} size={18} />} label="Database (PostGIS)" value="Healthy" isOnline />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatusRow icon={<Globe color={colors.accent} size={18} />} label="Environment" value="Production" />
      </Card>

      {/* Admin Management (Super Admin Only) */}
      {admin.role === "super_admin" && (
        <>
          <Text style={styles.sectionTitle}>ADMIN MANAGEMENT</Text>
          <Card style={{ marginTop: spacing.sm }}>
            {!showCreate ? (
              <View style={styles.manageRow}>
                <View>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Create New Admin</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    Add a new operator to the dashboard
                  </Text>
                </View>
                <Button 
                  label="Add" 
                  variant="secondary" 
                  onPress={() => setShowCreate(true)} 
                  icon={<Plus color={colors.textPrimary} size={16} />} 
                />
              </View>
            ) : (
              <View style={{ paddingVertical: spacing.sm }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                  Create Admin Account
                </Text>
                
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }]}
                />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor={colors.textMuted}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }]}
                />
                <TextInput
                  placeholder="Temporary Password"
                  placeholderTextColor={colors.textMuted}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }]}
                />

                <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
                  <Button label="Cancel" variant="secondary" onPress={() => setShowCreate(false)} style={{ flex: 1 }} />
                  <Button label="Create Admin" onPress={onCreateAdmin} style={{ flex: 1 }} />
                </View>
              </View>
            )}
          </Card>
        </>
      )}

      {/* Sign Out */}
      <View style={{ marginTop: spacing.xxxl }}>
        <Button
          label="Sign out of Admin Console"
          variant="danger"
          onPress={handleSignOut}
          icon={<LogOut color="#fff" size={18} />}
        />
      </View>
      <Text style={[typography.micro, { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl }]}>
        SmartFare Admin v1.0.0
      </Text>
    </ScrollView>
  );
}

function StatusRow({ icon, label, value, isOnline }: { icon: any; label: string; value: string; isOnline?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statusRow}>
      {icon}
      <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: spacing.md, flex: 1 }]}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {isOnline && <CheckCircle2 color={colors.success} size={14} style={{ marginRight: 4 }} />}
        <Text style={[typography.bodySm, { color: isOnline ? colors.success : colors.textSecondary, fontWeight: "600" }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ThemeChip({ active, onPress, Icon, colors }: { active: boolean; onPress: () => void; Icon: any; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.themeChip, { backgroundColor: active ? colors.surface : "transparent" }]}
    >
      <Icon color={active ? colors.accent : colors.textMuted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  sectionTitle: { fontFamily: "System", fontSize: 11, fontWeight: "700", letterSpacing: 1, color: "#888", marginTop: spacing.xxl, marginLeft: 4 },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  badgeRow: { flexDirection: "row", marginTop: spacing.sm },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.sm },
  statusRow: { flexDirection: "row", alignItems: "center", padding: spacing.lg },
  divider: { height: 1, marginLeft: 52 },
  manageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  themeRow: { flexDirection: "row", alignItems: "center" },
  segmented: { flexDirection: "row", borderRadius: radii.md, padding: 3 },
  themeChip: { width: 40, height: 32, alignItems: "center", justifyContent: "center", borderRadius: radii.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    outlineStyle: "none" as any,
  },
});