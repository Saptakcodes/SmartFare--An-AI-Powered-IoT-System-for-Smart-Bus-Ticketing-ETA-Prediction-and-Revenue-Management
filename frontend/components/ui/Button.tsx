import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing, touch } from "../../theme/tokens";
import { typography } from "../../theme/typography";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: Props) {
  const { colors } = useTheme();

  const height = size === "sm" ? 38 : size === "lg" ? 54 : touch.comfortable;
  const fontStyle =
    size === "sm" ? typography.bodySm : typography.bodyMedium;

  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onPress();
  };

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : colors.primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              fontStyle,
              {
                color:
                  variant === "primary" || variant === "danger"
                    ? "#fff"
                    : variant === "secondary"
                    ? colors.textPrimary
                    : colors.textSecondary,
                marginLeft: icon ? spacing.sm : 0,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  const baseStyle: ViewStyle = {
    height,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    opacity: isDisabled ? 0.6 : 1,
    width: fullWidth ? "100%" : undefined,
    paddingHorizontal: spacing.lg,
  };

  if (variant === "primary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[baseStyle, style]}
      >
        <LinearGradient
          colors={colors.brandGradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.md }]}
        />
        {content}
      </Pressable>
    );
  }

  if (variant === "danger") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          baseStyle,
          { backgroundColor: colors.danger },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          baseStyle,
          {
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "transparent",
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[baseStyle, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});