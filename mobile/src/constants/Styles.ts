import colors from "tailwindcss/colors";

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Colors = {
  transparent: colors.transparent,

  neutral0: "#000000",
  neutral7: "#121212",
  neutral10: "#1B1D1F", // Technically not the same hue or saturation.
  neutral20: "#333333",
  neutral40: "#666666",
  neutral65: "#A6A6A6",
  neutral80: "#CCCCCC",
  neutral85: "#D9D9D9",
  neutral95: "#F2F2F2",
  neutral100: "#FFFFFF",

  red: "#C8102E",
  yellow: "#FFD84D",
} as const;

export const FontFamily = {
  roboto: "Roboto-Regular",
  robotoMedium: "Roboto-Medium",
  inter: "Inter-Regular",
  interMedium: "Inter-Medium",
  geistMono: "GeistMono-Regular",
  geistMonoMedium: "GeistMono-Medium",
  ndot: "Ndot-77_JP_Extended",
  ntype: "NType82-Headline",
} as const;

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  "4xl": 36,
  "5xl": 48,
} as const;
