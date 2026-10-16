export const palette = {
  bgDeep: "#050B1E",
  bgSurface: "#0B1736",
  bgElevated: "#112148",
  bgHigher: "#172A57",
  borderSubtle: "rgba(120,170,255,0.14)",
  borderStrong: "rgba(120,170,255,0.24)",

  primaryBlue: "#1E6BFF",
  primaryCyan: "#22D3EE",

  textPrimaryDark: "#FFFFFF",
  textSecondaryDark: "#A9B8D9",
  textMutedDark: "#6B7CA3",

  success: "#2EE6A6",
  warning: "#FFC857",
  danger: "#FF5C7A",
  info: "#5AB0FF",

  bgLight: "#F4F8FF",
  bgLightSurface: "#FFFFFF",
  bgLightElevated: "#EDF3FF",
  borderLight: "rgba(11,23,54,0.08)",

  textPrimaryLight: "#0B1736",
  textSecondaryLight: "#4A5A80",
  textMutedLight: "#8291B0",
} as const;

export const gradients = {
  brand: ["#1E6BFF", "#22D3EE"] as const,
  brandSoft: ["rgba(30,107,255,0.18)", "rgba(34,211,238,0.18)"] as const,
  success: ["#2EE6A6", "#1E6BFF"] as const,
  danger: ["#FF5C7A", "#FFA36C"] as const,
  card: ["rgba(30,107,255,0.06)", "rgba(34,211,238,0.03)"] as const,
} as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const touch = {
  min: 44,
  comfortable: 48,
} as const;

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1200,
  wide: 1600,
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 300,
} as const;

// Elevation presets — subtle depth for dark mode
export const elevation = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  elevated: string;
  higher: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  brandGradient: readonly [string, string];
  brandGradientSoft: readonly [string, string];
  cardGradient: readonly [string, string];
  isDark: boolean;
}

export const darkTheme: ThemeColors = {
  bg: palette.bgDeep,
  surface: palette.bgSurface,
  elevated: palette.bgElevated,
  higher: palette.bgHigher,
  border: palette.borderSubtle,
  borderStrong: palette.borderStrong,
  textPrimary: palette.textPrimaryDark,
  textSecondary: palette.textSecondaryDark,
  textMuted: palette.textMutedDark,
  primary: palette.primaryBlue,
  accent: palette.primaryCyan,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  brandGradient: gradients.brand,
  brandGradientSoft: gradients.brandSoft,
  cardGradient: gradients.card,
  isDark: true,
};

export const lightTheme: ThemeColors = {
  bg: palette.bgLight,
  surface: palette.bgLightSurface,
  elevated: palette.bgLightElevated,
  higher: "#E4EDFF",
  border: palette.borderLight,
  borderStrong: "rgba(11,23,54,0.16)",
  textPrimary: palette.textPrimaryLight,
  textSecondary: palette.textSecondaryLight,
  textMuted: palette.textMutedLight,
  primary: palette.primaryBlue,
  accent: palette.primaryCyan,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  brandGradient: gradients.brand,
  brandGradientSoft: gradients.brandSoft,
  cardGradient: gradients.card,
  isDark: false,
};