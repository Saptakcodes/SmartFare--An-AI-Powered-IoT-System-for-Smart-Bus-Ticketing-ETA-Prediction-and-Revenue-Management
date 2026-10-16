import React, { useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

export function OTPInput({ length = 6, value, onChange, autoFocus }: Props) {
  const { colors } = useTheme();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const chars = useMemo(() => {
    const padded = (value + " ".repeat(length)).slice(0, length);
    return padded.split("");
  }, [value, length]);

  const setChar = (idx: number, ch: string) => {
    const digits = ch.replace(/\D/g, "");
    if (!digits) return;
    const arr = value.split("");
    // Support multi-char paste
    for (let i = 0; i < digits.length && idx + i < length; i++) {
      arr[idx + i] = digits[i];
    }
    const next = arr.join("").slice(0, length);
    onChange(next);
    const target = Math.min(idx + digits.length, length - 1);
    inputs.current[target]?.focus();
  };

  const onKeyPress = (
    idx: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (chars[idx] && chars[idx] !== " ") {
        const arr = value.split("");
        arr[idx] = "";
        onChange(arr.join("").trimEnd());
      } else if (idx > 0) {
        const arr = value.split("");
        arr[idx - 1] = "";
        onChange(arr.join("").trimEnd());
        inputs.current[idx - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, idx) => {
        const isFocused = focusIndex === idx;
        const filled = chars[idx] && chars[idx] !== " ";
        return (
          <View
            key={idx}
            style={[
              styles.box,
              {
                borderColor: isFocused
                  ? colors.accent
                  : filled
                  ? colors.primary
                  : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <TextInput
              ref={(r) => {
                inputs.current[idx] = r;
              }}
              value={filled ? chars[idx] : ""}
              onChangeText={(t) => {
                if (t.length > 1) {
                  // Paste
                  onChange(t.replace(/\D/g, "").slice(0, length));
                  inputs.current[Math.min(t.length, length) - 1]?.focus();
                } else {
                  setChar(idx, t);
                }
              }}
              onKeyPress={(e) => onKeyPress(idx, e)}
              onFocus={() => setFocusIndex(idx)}
              onBlur={() => setFocusIndex(null)}
              keyboardType="number-pad"
              maxLength={length}
              autoFocus={autoFocus && idx === 0}
              style={[
                styles.field,
                typography.h2,
                { color: colors.textPrimary },
              ]}
              caretHidden
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    textAlign: "center",
    width: "100%",
    padding: 0,
  },
});