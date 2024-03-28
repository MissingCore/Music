import type { Theme } from "@react-navigation/native";

import Colors from "./Colors";

const NavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.accent,
    background: Colors.canvas,
    card: Colors.canvas,
    text: Colors.foreground,
    border: Colors.canvas,
    notification: Colors.accent,
  },
};

export default NavigationTheme;
