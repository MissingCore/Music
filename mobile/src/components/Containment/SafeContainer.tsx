import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Regular or animated `<View />` with default top padding to account for
 * status bar. `paddingTop` style not supported.
 */
export function SafeContainer({
  animated = false,
  style,
  ...props
}:
  | ({ animated: true } & AnimatedProps<ViewProps>)
  | ({ animated?: false } & ViewProps)) {
  const insets = useSafeAreaInsets();
  // Note: Last style has precedence.
  return animated ? (
    <Animated.View {...props} style={[style, { paddingTop: insets.top }]} />
  ) : (
    // @ts-expect-error ts(2769) — Unreasonable conflict with `style` prop.
    <View {...props} style={[style, { paddingTop: insets.top }]} />
  );
}
