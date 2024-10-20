import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";

import { StickyActionHeader } from "./StickyActionLayout";

/**
 * FlashList layout with optional action component that gets stickied
 * after scrolling.
 */
export function StickyActionListLayout<TData>({
  title,
  StickyAction,
  estimatedActionSize = 0,
  ...flashListProps
}: FlashListProps<TData> & {
  /** Name of list. */
  title: string;
  /** Optional action displayed in layout. */
  StickyAction?: React.JSX.Element;
  /** Height of the StickyAction. */
  estimatedActionSize?: number;
}) {
  const { top } = useSafeAreaInsets();
  const { width: ScreenWidth } = useWindowDimensions();
  const { bottomInset } = useBottomActionsLayout();

  const initActionPos = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

  // Declare inside the component to ensure type-safety.
  const AnimatedFlashList = useMemo(
    () => Animated.createAnimatedComponent<FlashListProps<TData>>(FlashList),
    [],
  );

  /** Calculate the initial starting position of `StickyAction`. */
  const calcInitStartPos = useCallback(
    (e: LayoutChangeEvent) => {
      // 16px Padding Top + Header Height
      initActionPos.value = 16 + e.nativeEvent.layout.height;
    },
    [initActionPos],
  );

  /** Animated scroll events on `AnimatedFlashList`. */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollAmount.value = e.contentOffset.y;
    },
  });

  const actionOffset = useAnimatedStyle(() => ({
    // Prevent initial layout shift of stickied action.
    display: initActionPos.value > 0 ? "flex" : "none",
    top: clamp(
      initActionPos.value - scrollAmount.value,
      top + 16,
      initActionPos.value,
    ),
  }));

  return (
    <>
      <AnimatedFlashList
        onScroll={scrollHandler}
        ListHeaderComponent={
          <StickyActionHeader
            onLayout={calcInitStartPos}
            style={[
              StickyAction ? { marginBottom: estimatedActionSize + 24 } : {},
            ]}
            className="pb-6"
          >
            {title}
          </StickyActionHeader>
        }
        showsVerticalScrollIndicator={false}
        {...flashListProps}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 16 }}
      />

      {StickyAction ? (
        <Animated.View
          entering={FadeIn}
          pointerEvents="box-none"
          style={[{ maxWidth: ScreenWidth - 32 }, actionOffset]}
          className="absolute right-4"
        >
          {StickyAction}
        </Animated.View>
      ) : null}
    </>
  );
}
