import { TrendingDown, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { Card } from "./Card";

interface Props {
  label: string;
  value: string;
  delta?: number; // percentage, +/- 
  hint?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, delta, hint, style }: Props) {
  const { colors } = useTheme();
  const isPositive = (delta ?? 0) >= 0;
  const deltaColor = isPositive ? colors.success : colors.danger;

  return (
    <Card style={style}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.numeric,
          { color: colors.textPrimary, marginTop: spacing.sm },
        ]}
      >
        {value}
      </Text>
      {typeof delta === "number" ? (
        <View style={styles.deltaRow}>
          {isPositive ? (
            <TrendingUp color={deltaColor} size={14} />
          ) : (
            <TrendingDown color={deltaColor} size={14} />
          )}
          <Text
            style={[
              typography.caption,
              { color: deltaColor, marginLeft: spacing.xs },
            ]}
          >
            {isPositive ? "+" : ""}
            {delta.toFixed(1)}%
          </Text>
        </View>
      ) : null}
      {hint ? (
        <Text
          style={[
            typography.micro,
            { color: colors.textMuted, marginTop: spacing.xs },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
});