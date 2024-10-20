import { useCallback } from "react";
import type { ScrollViewProps } from "react-native";
import { View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";

import { cn } from "@/lib/style";
import { AccentText } from "@/components/new/Typography";

//#region Layout
/** Full-screen layout for displaying content on pages without a header bar. */
export function StickyActionLayout({
  title,
  StickyAction,
  children,
  onScroll: jsOnScroll,
  ...rest
}: ScrollViewProps & { title: string; StickyAction?: React.ReactNode }) {
  const { bottomInset } = useBottomActionsLayout();
  const { initActionYPos, scrollHandler, actionStyle } =
    useStickyActionLayoutAnimations();

  return (
    <Animated.ScrollView
      // FIXME: Currently have a problem where we need a regular JS scroll handler
      // and a Reanimated scroll handler on the same component. Currently, this isn't
      // possible to dom so what's below is currently a workaround.
      //  - https://github.com/kirillzyusko/react-native-keyboard-controller/pull/339
      //  - https://github.com/software-mansion/react-native-reanimated/issues/6204
      // @ts-expect-error `onScrollReanimated` is a fake prop needed for reanimated to intercept scroll events
      onScrollReanimated={scrollHandler}
      onScroll={jsOnScroll}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={!!StickyAction ? [1] : undefined}
      {...rest}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 16 }}
      contentContainerClassName="grow gap-6"
    >
      <StickyActionHeader>{title}</StickyActionHeader>

      <View
        onLayout={initActionYPos}
        pointerEvents="box-none"
        className={cn({ hidden: !StickyAction })}
      >
        <Animated.View
          pointerEvents="box-none"
          // Nested due to Reanimated crashing when an Animated component
          // using an animated style is stickied.
          style={actionStyle}
          className="items-end"
        >
          {StickyAction}
        </Animated.View>
      </View>

      {children}
    </Animated.ScrollView>
  );
}
//#endregion

//#region Header
/** Header component rendered in `<StickyActionLayout />`. */
export function StickyActionHeader({
  noOffset = false,
  className,
  style,
  ...rest
}: React.ComponentProps<typeof AccentText> & { noOffset?: boolean }) {
  const { top } = useSafeAreaInsets();
  return (
    <AccentText
      style={[!noOffset ? { paddingTop: top + 16 } : {}, style]}
      className={cn("text-3xl", className)}
      {...rest}
    />
  );
}
//#endregion

//#region Layout Hook
/**
 * Custom hook containing the animation logic to implement a `<StickyActionLayout />`
 * for custom content such as nested scrollviews.
 */
export function useStickyActionLayoutAnimations() {
  const { top } = useSafeAreaInsets();
  const actionPosY = useSharedValue(0);
  const actionOffset = useSharedValue(0);

  /**
   * Identify the starting `y` position the sticky action is located in
   * the scrollable.
   */
  const initActionYPos = useCallback(
    (e: { nativeEvent: { layout: { y: number } } }) => {
      actionPosY.value = e.nativeEvent.layout.y;
    },
    [actionPosY],
  );

  /**
   * Animation logic that ensures the sticky action gets stickied under
   * the status bar at an offset.
   *
   * **Note:** Can only be used in an `Animated` scrollable.
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const scroll = e.contentOffset.y;

      const maxOffset = top + 16;
      const stickyStart = actionPosY.value - maxOffset;

      let offset = scroll < stickyStart ? 0 : scroll - stickyStart;
      if (offset > maxOffset) offset = maxOffset;
      actionOffset.value = offset;
    },
  });

  /** Animated styling on the element wrapping the sticky action. */
  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: actionOffset.value }],
  }));

  return { initActionYPos, scrollHandler, actionStyle };
}
//#endregion
