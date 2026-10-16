import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: Props) {
  const { colors } = useTheme();
  const bg = active ? colors.primary + "22" : "transparent";
  const border = active ? colors.primary : colors.border;
  const fg = active ? colors.primary : colors.textSecondary;

  const content = (
    <Text style={[typography.caption, { color: fg }]}>{label}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: bg, borderColor: border },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Text
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: border, color: fg },
        typography.caption,
        style as any,
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: "hidden",
  },
});