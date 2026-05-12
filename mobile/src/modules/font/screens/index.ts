import { AccentFonts, PrimaryFonts } from "./View";

const FontScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    AccentFonts: {
      screen: AccentFonts,
      options: { title: "feat.font.extra.accent" },
    },
    PrimaryFonts: {
      screen: PrimaryFonts,
      options: { title: "feat.font.extra.primary" },
    },
  },
} as const;

export default FontScreenGroup;
