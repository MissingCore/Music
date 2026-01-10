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

/** @deprecated Use colors from `useTheme` if possible instead. */
export const Colors = {
  transparent: colors.transparent,

  neutral0: "#000000",
  neutral7: "#121212",
  neutral10: "#1C1C1C",
  neutral13: "#212121",
  neutral15: "#292929",
  neutral20: "#323232",
  neutral40: "#606060",
  neutral70: "#ADADAD",
  neutral80: "#C8C8C8",
  neutral85: "#D9D9D9",
  neutral90: "#E3E3E3",
  neutral92: "#EBEBEB",
  neutral95: "#F2F2F2",
  neutral98: "#FAFAFA",
  neutral100: "#FFFFFF",

  red35: "#A50D26",
  red40: "#C8102E",

  yellow45: "#E5B300",
  yellow50: "#FFC700",

  red: "#C8102E",
  yellow: "#FFC700",
  blue: "#4142BE",
  green: "#1DB159",
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

  system: "System",
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
