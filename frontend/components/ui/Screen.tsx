import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["top", "left", "right"],
  contentStyle,
  style,
}: Props) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        padded && { paddingHorizontal: spacing.xl },
        {
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxl,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: colors.bg }, style]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});