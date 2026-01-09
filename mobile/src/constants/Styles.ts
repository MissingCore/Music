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

/** @deprecated Use the new M3 theme variables. */
export const Colors = {
  transparent: colors.transparent,

  neutral0: "#000000",
  neutral5: "#0F0F0F",
  neutral10: "#1C1C1C",
  neutral13: "#212121",
  neutral15: "#292929",
  neutral20: "#323232",
  neutral40: "#606060",
  neutral70: "#ADADAD",
  neutral85: "#D9D9D9",
  neutral90: "#E3E3E3",
  neutral92: "#EBEBEB",
  neutral95: "#F2F2F2",
  neutral98: "#FAFAFA",
  neutral100: "#FFFFFF",

  red40: "#C8102E",
  red50: "#DE1233",

  yellow50: "#FFC700",
  yellow60: "#FFCF24",

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
