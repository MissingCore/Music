import CreateTheme from "./CreateView";
import ModifyTheme from "./ModifyView";
import Themes from "./View";

const ThemeScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    Themes: {
      screen: Themes,
      options: { title: "feat.theme.title" },
    },
    CreateTheme: {
      screen: CreateTheme,
      options: { title: "form.create" },
    },
    ModifyTheme: {
      screen: ModifyTheme,
      options: { title: "form.edit" },
    },
  },
} as const;

export default ThemeScreenGroup;
