import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  children: React.ReactNode;
}

/**
 * Clean background for auth screens.
 * Uses a subtle vertical gradient with two accent glows in the corners
 * so the screen feels branded without visual noise behind the form.
 */
export function AuthBackground({ children }: Props) {
  const { colors, isDark } = useTheme();

  const baseColors = isDark
    ? (["#050B1E", "#0A1736", "#050B1E"] as const)
    : (["#F4F8FF", "#E9F1FF", "#F4F8FF"] as const);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Base vertical gradient */}
      <LinearGradient
        colors={baseColors as unknown as string[]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top-left cyan glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(34,211,238,0.14)", "rgba(34,211,238,0)"]
            : ["rgba(34,211,238,0.10)", "rgba(34,211,238,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={styles.glowTopLeft}
      />

      {/* Bottom-right blue glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(30,107,255,0)", "rgba(30,107,255,0.16)"]
            : ["rgba(30,107,255,0)", "rgba(30,107,255,0.10)"]
        }
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowBottomRight}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  glowTopLeft: {
    position: "absolute",
    left: -120,
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowBottomRight: {
    position: "absolute",
    right: -120,
    bottom: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  content: { flex: 1 },
});