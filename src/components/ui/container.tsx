import type { ViewProps } from "react-native";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/style";

/**
 * @description `<Animated.View />` or `<View />` with default top padding
 *  to account for status bar. `paddingTop` style not supported.
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

/** @description Horizontal-scrolling list with default styling. */
export function ScrollRow({
  contentContainerClassName,
  ...props
}: Omit<
  React.ComponentProps<typeof ScrollView>,
  "horizontal" | "showsHorizontalScrollIndicator"
>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      contentContainerClassName={cn(
        "grow gap-2 px-4",
        contentContainerClassName,
      )}
      {...props}
    />
  );
}
