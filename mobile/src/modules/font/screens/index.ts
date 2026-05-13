import CreateFont from "./CreateView";
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
    CreateFont: {
      screen: CreateFont,
      options: { title: "form.create" },
    },
  },
} as const;

export default FontScreenGroup;
