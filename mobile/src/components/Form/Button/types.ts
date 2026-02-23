import type { PressableProps, RNGHPressableProps } from "../../Base/Pressable";

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<
  PressableProps,
  | "disabled"
  | "delayLongPress"
  | "onLongPress"
  | "onPress"
  | "onPressIn"
  | "onPressOut"
>;

/** The most "used" action props used on `<Pressable />`. */
export type RNGHPressProps = Pick<
  RNGHPressableProps,
  | "disabled"
  | "delayLongPress"
  | "onLongPress"
  | "onPress"
  | "onPressIn"
  | "onPressOut"
>;
