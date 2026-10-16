import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

type Urgency = "soon" | "normal" | "later" | "stale";

interface Props {
  minutes: number;
  confidence?: "low" | "medium" | "high";
  urgency?: Urgency;
  stale?: boolean;
  style?: ViewStyle;
}

export function ETAPill({
  minutes,
  confidence = "high",
  urgency,
  stale,
  style,
}: Props) {
  const { colors } = useTheme();

  const computedUrgency: Urgency =
    urgency ?? (stale ? "stale" : minutes <= 2 ? "soon" : minutes <= 10 ? "normal" : "later");

  const colorMap: Record<Urgency, { bg: string; fg: string; label: string }> = {
    soon: { bg: colors.success + "22", fg: colors.success, label: "Arriving" },
    normal: { bg: colors.primary + "22", fg: colors.primary, label: "" },
    later: { bg: colors.textMuted + "22", fg: colors.textSecondary, label: "" },
    stale: { bg: colors.warning + "22", fg: colors.warning, label: "Stale" },
  };

  const { bg, fg, label } = colorMap[computedUrgency];

  const confidenceDot = {
    low: "○",
    medium: "◐",
    high: "●",
  }[confidence];

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[typography.numericSm, { color: fg }]}>
        {minutes === 0 ? "Now" : `${minutes}m`}
      </Text>
      {!stale ? (
        <Text style={[typography.caption, { color: fg, marginLeft: spacing.xs, opacity: 0.7 }]}>
          {confidenceDot}
        </Text>
      ) : null}
      {label ? (
        <Text style={[typography.caption, { color: fg, marginLeft: spacing.sm }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
});