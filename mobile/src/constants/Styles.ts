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
  neutral20: "#333333",
  neutral80: "#CCCCCC",
  neutral95: "#F2F2F2",
  neutral100: "#FFFFFF",

  red: "#C8102E",
  yellow: "#FFD84D",

  /* FIXME: Remove old colors below in the future. */
  canvas: "#000000",

  accent50: "#F28D91",
  accent500: "#D71921",

  foreground50: "#F0F2F2",
  foreground100: "#C1C4C4",

  surface50: "#E7E9E9",
  surface400: "#787878",
  surface500: "#484949",
  surface700: "#303030",
  surface800: "#1B1D1F",
  surface850: "#181919",
} as const;

export const FontFamily = {
  geistLight: "Geist-Light",
  geistMonoLight: "GeistMono-Light",
  geistMono: "GeistMono-Regular",
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
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  "3xl": 32,
} as const;
