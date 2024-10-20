import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import type { LayoutChangeEvent, ScrollViewProps } from "react-native";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  clamp,
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
  ...rest
}: ScrollViewProps & { title: string; StickyAction?: React.ReactNode }) {
  const { top } = useSafeAreaInsets();
  const { bottomInset } = useBottomActionsLayout();

  const initActionPos = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

  /** Calculate the initial starting position of `StickyAction`. */
  const calcInitStartPos = useCallback(
    (e: LayoutChangeEvent) => {
      // `e.nativeEvent.layout.y` includes the 16px Padding Top
      initActionPos.value = e.nativeEvent.layout.y;
    },
    [initActionPos],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollAmount.value = e.contentOffset.y;
    },
  });

  const actionOffset = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: clamp(
          // Make sure we never let the `StickyAction` go beyond the
          // status bar + a 16px offset.
          scrollAmount.value + top + 16 - initActionPos.value,
          0,
          top + 16,
        ),
      },
    ],
  }));

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={!!StickyAction ? [1] : undefined}
      {...rest}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 16 }}
      contentContainerClassName="grow gap-6"
    >
      <StickyActionHeader>{title}</StickyActionHeader>

      <View
        onLayout={calcInitStartPos}
        pointerEvents="box-none"
        className={cn({ hidden: !StickyAction })}
      >
        <Animated.View
          pointerEvents="box-none"
          // Nested due to Reanimated crashing when an Animated component
          // using an animated style is stickied.
          style={actionOffset}
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

//#region List Layout
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
