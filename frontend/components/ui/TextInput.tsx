import { Eye, EyeOff } from "lucide-react-native";
import React, { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing, touch } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  secureToggle?: boolean;
}

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { label, error, leftIcon, secureToggle, secureTextEntry, style, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.accent
              : colors.border,
          },
        ]}
      >
        {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
        <RNTextInput
          ref={ref}
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.field,
            typography.body,
            { color: colors.textPrimary },
            style,
          ]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            {hidden ? (
              <Eye color={colors.textMuted} size={20} />
            ) : (
              <EyeOff color={colors.textMuted} size={20} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  input: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touch.comfortable,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  field: {
    flex: 1,
    paddingVertical: spacing.md,
  },
});