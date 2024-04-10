import type { Theme } from "@react-navigation/native";

import Colors from "./Colors";

const NavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.accent500,
    background: Colors.canvas,
    card: Colors.canvas,
    text: Colors.foreground50,
    border: Colors.canvas,
    notification: Colors.accent500,
  },
};

export default NavigationTheme;
