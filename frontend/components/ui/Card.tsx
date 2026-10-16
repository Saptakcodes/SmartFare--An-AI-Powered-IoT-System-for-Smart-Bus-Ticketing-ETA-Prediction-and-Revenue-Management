import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { elevation, radii, spacing } from "../../theme/tokens";

interface Props {
  children: React.ReactNode;
  variant?: "solid" | "elevated" | "outline" | "gradient" | "accent";
  padded?: boolean;
  accentColor?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "solid",
  padded = true,
  accentColor,
  style,
}: Props) {
  const { colors } = useTheme();
  const paddingStyle = padded ? { padding: spacing.lg } : undefined;

  if (variant === "gradient") {
    return (
      <View
        style={[
          styles.base,
          { borderColor: colors.border, overflow: "hidden" },
          elevation.sm,
          style,
        ]}
      >
        <LinearGradient
          colors={colors.cardGradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={paddingStyle}>{children}</View>
      </View>
    );
  }

  if (variant === "accent") {
    return (
      <View
        style={[
          styles.base,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            overflow: "hidden",
          },
          elevation.sm,
          style,
        ]}
      >
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accentColor || colors.accent },
          ]}
        />
        <View style={paddingStyle}>{children}</View>
      </View>
    );
  }

  if (variant === "outline") {
    return (
      <View
        style={[
          styles.base,
          {
            backgroundColor: "transparent",
            borderColor: colors.borderStrong,
          },
          paddingStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (variant === "elevated") {
    return (
      <View
        style={[
          styles.base,
          {
            backgroundColor: colors.elevated,
            borderColor: colors.border,
          },
          elevation.md,
          paddingStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // default solid
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        paddingStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});