import type { PressableProps } from "react-native";

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<
  PressableProps,
  "disabled" | "delayLongPress" | "onLongPress" | "onPress" | "onPressOut"
>;
