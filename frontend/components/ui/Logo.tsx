import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: Props) {
  const { colors } = useTheme();

  const dimension = { sm: 32, md: 48, lg: 72, xl: 96 }[size];
  const fontSize = { sm: 16, md: 22, lg: 30, xl: 40 }[size];

  return (
    <View style={styles.row}>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: dimension, height: dimension }}
        contentFit="contain"
      />
      {showText && (
        <View style={[styles.wordmark, { marginLeft: spacing.sm }]}>
          <Text
            style={[
              styles.text,
              { fontSize, color: colors.textPrimary },
            ]}
          >
            Smart
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize, color: colors.accent },
            ]}
          >
            Fare
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  wordmark: { flexDirection: "row", alignItems: "center" },
  text: { fontWeight: "700", letterSpacing: -0.6 },
});