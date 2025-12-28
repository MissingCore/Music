import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ContainerProps = { additionalTopOffset?: number } & (
  | ({ animated: true } & AnimatedProps<ViewProps>)
  | ({ animated?: false } & ViewProps)
);

/**
 * Regular or animated `<View />` with default top padding to account for
 * status bar. `paddingTop` style not supported — use `additionalTopOffset`
 * prop instead.
 */
export function SafeContainer({
  animated = false,
  additionalTopOffset = 0,
  style,
  ...props
}: ContainerProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + additionalTopOffset;
  // Note: Last style has precedence.
  return animated ? (
    <Animated.View {...props} style={[style, { paddingTop }]} />
  ) : (
    // @ts-expect-error ts(2769) — Unreasonable conflict with `style` prop.
    <View {...props} style={[style, { paddingTop }]} />
  );
}
