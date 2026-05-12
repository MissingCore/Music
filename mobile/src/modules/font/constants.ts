//#region Bundled Fonts
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
