import { Check } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  style?: ViewStyle;
}

export function Checkbox({ checked, onChange, label, style }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={[styles.container, style]}
      hitSlop={10}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? colors.accent : "transparent",
            borderColor: checked ? colors.accent : colors.border,
          },
        ]}
      >
        {checked && <Check color="#fff" size={14} strokeWidth={3} />}
      </View>
      <Text
        style={[
          typography.bodySm,
          { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
    box: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 2, // <-- CHANGED FROM 1.5 to 2
    alignItems: "center",
    justifyContent: "center",
  },
});