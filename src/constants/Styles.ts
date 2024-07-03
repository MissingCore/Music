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
  ndot57: "Ndot-57",
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
} as const;
