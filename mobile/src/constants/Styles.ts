import colors from "tailwindcss/colors";

export const BorderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Colors = {
  transparent: colors.transparent,

  neutral0: "#000000",
  neutral5: "#0D0D0D",
  neutral10: "#1B1D1F", // Technically not the same hue or saturation.
  neutral15: "#262626",
  neutral20: "#333333",
  neutral40: "#666666",
  neutral80: "#CCCCCC",
  neutral95: "#F2F2F2",
  neutral100: "#FFFFFF",

  red: "#C8102E",
  yellow: "#FFD84D",
} as const;

export const FontFamily = {
  roboto: "Roboto-Regular",
  robotoMedium: "Roboto-Medium",
  ndot: "Ndot-77_JP_Extended",
  ntype: "NType82-Headline",
} as const;

export const TwFontFamilies = Object.keys(FontFamily).map(
  (f) => `font-${f}` as `font-${(typeof FontFamily)[keyof typeof FontFamily]}`,
);

export const FontSize = {
  title: 36,
  subtitle: 28,
  xxs: 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  "3xl": 32,
} as const;
