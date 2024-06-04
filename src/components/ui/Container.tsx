import type { ViewProps } from "react-native";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/style";

/**
 * @description `<Animated.View />` with default top padding to account
 *  for status bar. `paddingTop` style not supported.
 */
export function AnimatedSafeContainer({
  style,
  ...props
}: AnimatedProps<ViewProps>) {
  const insets = useSafeAreaInsets();
  // Note: Last style has precedence.
  return (
    <Animated.View style={[style, { paddingTop: insets.top }]} {...props} />
  );
}

/**
 * @description `<View />` with default top padding to account for status
 *  bar. `paddingTop` style not supported.
 */
export function SafeContainer({ style, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();
  // Note: Last style has precedence.
  return <View style={[style, { paddingTop: insets.top }]} {...props} />;
}

export type ScrollRowProps = Omit<
  React.ComponentProps<typeof ScrollView>,
  "horizontal" | "showsHorizontalScrollIndicator"
>;

/** @description Horizontal-scrolling list with default styling. */
export function ScrollRow({
  contentContainerClassName,
  ...props
}: ScrollRowProps) {
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
