import { Bell, Search } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props {
  title: string;
  adminEmail: string;
}

export function AdminTopBar({ title, adminEmail }: Props) {
  const { colors } = useTheme();

  const initials = adminEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <View style={[styles.bar, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.textMuted} size={15} />
          <TextInput
            placeholder="Search journeys, buses..."
            placeholderTextColor={colors.textMuted}
            style={[
              typography.bodySm,
              styles.searchInput,
              { color: colors.textPrimary },
              Platform.OS === "web" && { outlineStyle: "none" as any }, // Fix white box on web
            ]}
          />
        </View>

        <Pressable style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Bell color={colors.textSecondary} size={16} />
          <View style={[styles.badgeDot, { backgroundColor: colors.accent }]} />
        </Pressable>

        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: "700" }]}>
            {initials}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  left: { flexDirection: "row", alignItems: "center" },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 280, // Widened from 220
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});