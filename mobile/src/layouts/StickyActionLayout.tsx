import { useCallback } from "react";
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
  offsetConfig = {},
  originalText,
}: {
  title: string;
  StickyAction?: React.ReactNode;
  children: React.ReactNode;
  /**
   * Configure the vertical offset/padding for this layout.
   */
  offsetConfig?: { top?: boolean; bottom?: boolean };
  /** Ignore the uppercase behavior when the accent font is `NDot`. */
  originalText?: boolean;
}) {
  const { bottomInset } = useBottomActionsLayout();
  const { top } = useSafeAreaInsets();
  const { initActionYPos, onScroll, actionStyle } =
    useStickyActionLayoutAnimations();

  const configs = { top: true, bottom: true, ...offsetConfig };

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={!!StickyAction ? [1] : undefined}
      contentContainerStyle={{
        paddingBottom: (configs.bottom ? bottomInset : 0) + 16,
      }}
      contentContainerClassName="grow gap-6 p-4"
    >
      <AccentText
        originalText={originalText}
        style={[configs.top ? { paddingTop: top + 16 } : {}]}
        className="text-3xl"
      >
        {title}
      </AccentText>

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
  const onScroll = useAnimatedScrollHandler((e) => {
    const scroll = e.contentOffset.y;

    const maxOffset = top + 16;
    const stickyStart = actionPosY.value - maxOffset;

    let offset = scroll < stickyStart ? 0 : scroll - stickyStart;
    if (offset > maxOffset) offset = maxOffset;
    actionOffset.value = offset;
  });

  /** Animated styling on the element wrapping the sticky action. */
  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: actionOffset.value }],
  }));

  return { initActionYPos, onScroll, actionStyle };
}
//#endregion
