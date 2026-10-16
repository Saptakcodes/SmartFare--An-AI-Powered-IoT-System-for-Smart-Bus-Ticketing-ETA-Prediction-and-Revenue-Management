import { TextStyle } from "react-native";

export const fontSizes = {
  display: 30,
  h1: 24,
  h2: 19,
  h3: 16,
  body: 14,
  bodySm: 13,
  caption: 12,
  micro: 11,
  tiny: 10,
} as const;

export const lineHeights = {
  display: 38,
  h1: 30,
  h2: 25,
  h3: 22,
  body: 20,
  bodySm: 18,
  caption: 16,
  micro: 14,
  tiny: 13,
} as const;

export const weights = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  heavy: "800" as TextStyle["fontWeight"],
};

export const typography = {
  display: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: weights.bold,
    letterSpacing: -0.6,
  } as TextStyle,
  h1: {
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.h1,
    fontWeight: weights.bold,
    letterSpacing: -0.4,
  } as TextStyle,
  h2: {
    fontSize: fontSizes.h2,
    lineHeight: lineHeights.h2,
    fontWeight: weights.semibold,
    letterSpacing: -0.2,
  } as TextStyle,
  h3: {
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    fontWeight: weights.semibold,
    letterSpacing: -0.1,
  } as TextStyle,
  body: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: weights.regular,
  } as TextStyle,
  bodyMedium: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: weights.medium,
  } as TextStyle,
  bodySm: {
    fontSize: fontSizes.bodySm,
    lineHeight: lineHeights.bodySm,
    fontWeight: weights.regular,
  } as TextStyle,
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: weights.medium,
    letterSpacing: 0.1,
  } as TextStyle,
  micro: {
    fontSize: fontSizes.micro,
    lineHeight: lineHeights.micro,
    fontWeight: weights.medium,
    letterSpacing: 0.3,
  } as TextStyle,
  tiny: {
    fontSize: fontSizes.tiny,
    lineHeight: lineHeights.tiny,
    fontWeight: weights.semibold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  } as TextStyle,
  numeric: {
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.h1,
    fontWeight: weights.bold,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.6,
  } as TextStyle,
  numericSm: {
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    fontWeight: weights.semibold,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.2,
  } as TextStyle,
};