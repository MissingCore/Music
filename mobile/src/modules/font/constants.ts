//#region Bundled Fonts
export const FontFamily = {
  roboto: "Roboto-Regular",
  robotoMedium: "Roboto-Medium",
  inter: "Inter-Regular",
  interMedium: "Inter-Medium",
  geistMono: "GeistMono-Regular",
  geistMonoMedium: "GeistMono-Medium",
  ndot: "Ndot-77_JP_Extended",
  ntype: "NType82-Regular",
  ntypeHeadline: "NType82-Headline",

  system: "System",
} as const;

export const BundledFontOptions = [
  "NDot",
  "NType",
  "Roboto",
  "Inter",
  "Geist Mono",
  "System",
] as const;

export type BundledFont = (typeof BundledFontOptions)[number];
//#endregion
