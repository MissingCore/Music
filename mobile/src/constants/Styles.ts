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
  neutral10: "#1C1C1C",
  neutral15: "#292929",
  neutral20: "#323232",
  neutral30: "#484848",
  neutral40: "#606060",
  neutral50: "#777777",
  neutral60: "#929292",
  neutral70: "#ADADAD",
  neutral80: "#C8C8C8",
  neutral90: "#E3E3E3",
  neutral95: "#F2F2F2",
  neutral100: "#FFFFFF",

  red: "#D71921",
  yellow: "#FFC700",
  blue: "#2A2B7B",
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
