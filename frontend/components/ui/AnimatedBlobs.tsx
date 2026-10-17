import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  intensity?: number; // 0-1, default 1
}

/**
 * Slow-drifting gradient blobs behind content.
 * Two soft blobs (cyan top-left, blue bottom-right) breathing in place.
 */
export function AnimatedBlobs({ intensity = 1 }: Props) {
  const { isDark } = useTheme();

  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(drift1, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift1, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(drift2, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift2, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const loopPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    loopPulse.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loopPulse.stop();
    };
  }, [drift1, drift2, pulse]);

  const blob1Style = {
    transform: [
      {
        translateX: drift1.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, 40],
        }),
      },
      {
        translateY: drift1.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 30],
        }),
      },
      { scale: pulse },
    ],
    opacity: 0.55 * intensity,
  };

  const blob2Style = {
    transform: [
      {
        translateX: drift2.interpolate({
          inputRange: [0, 1],
          outputRange: [40, -30],
        }),
      },
      {
        translateY: drift2.interpolate({
          inputRange: [0, 1],
          outputRange: [30, -20],
        }),
      },
      { scale: pulse },
    ],
    opacity: 0.45 * intensity,
  };

  const blob1Color = isDark
    ? "rgba(34,211,238,0.22)"
    : "rgba(34,211,238,0.16)";
  const blob2Color = isDark
    ? "rgba(30,107,255,0.20)"
    : "rgba(30,107,255,0.14)";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.blob, styles.blob1, { backgroundColor: blob1Color }, blob1Style]}
      />
      <Animated.View
        style={[styles.blob, styles.blob2, { backgroundColor: blob2Color }, blob2Style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 360,
    height: 360,
    top: -120,
    left: -100,
  },
  blob2: {
    width: 420,
    height: 420,
    bottom: -160,
    right: -140,
  },
});