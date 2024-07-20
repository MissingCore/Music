import { forwardRef } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/style";

/**
 * `<Animated.View />` or `<View />` with default top padding to account
 * for status bar. `paddingTop` style not supported.
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

// eslint-disable-next-line import/export
export namespace ScrollRow {
  export type Ref = ScrollView;

  export type Props = Omit<
    React.ComponentProps<typeof ScrollView>,
    "horizontal" | "showsHorizontalScrollIndicator"
  >;
}

/** Horizontal-scrolling list with default styling. */
// eslint-disable-next-line @typescript-eslint/no-redeclare, import/export
export const ScrollRow = forwardRef<ScrollRow.Ref, ScrollRow.Props>(
  function ScrollRow({ contentContainerClassName, ...props }, ref) {
    return (
      <ScrollView
        ref={ref}
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
  },
);
