import type { FlashList, FlashListProps } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent, TextProps } from "react-native";
import { useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "~/hooks/useTheme";
import { useBottomActionsInset } from "../hooks/useBottomActions";

import { AnimatedFlashList } from "~/components/Defaults";
import { Scrollbar, useScrollbarContext } from "~/components/Scrollbar";
import { AccentText } from "~/components/Typography/AccentText";

/**
 * Flash List layout with optional action component that gets stickied
 * after scrolling.
 */
export function StickyActionListLayout<TData>({
  titleKey,
  StickyAction,
  estimatedActionSize = 0,
  listRef,
  insetDelta = 0,
  showScrollbar = true,
  ...props
}: Omit<FlashListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  /** Key to title in translations. */
  titleKey: ParseKeys;
  /** Optional action displayed in layout. */
  StickyAction?: React.JSX.Element;
  /** Height of the StickyAction. */
  estimatedActionSize?: number;
  /** Pass a ref to the animated FlashList. */
  listRef?: React.Ref<FlashList<any>>;
  /**
   * How much we want to cut away from the bottom inset adjustment. Useful
   * for giving a more accurate `estimatedItemSize` when faking "gaps".
   */
  insetDelta?: number;
  /** Whether the scrollbar should appear on scroll. */
  showScrollbar?: boolean;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { width: ScreenWidth } = useWindowDimensions();
  const bottomInset = useBottomActionsInset();
  const { canvas } = useTheme();

  const [actionStartPos, setActionStartPos] = useState(0);
  const initActionPos = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

  const { isVisible, onScroll, scrollPosition, ...layoutListeners } =
    useScrollbarContext({
      showScrollbar,
      topOffset: actionStartPos,
      bottomOffset: bottomInset.withNav + 16 - insetDelta,
    });

  /** Calculate the initial starting position of `StickyAction`. */
  const calcInitStartPos = useCallback(
    (e: LayoutChangeEvent) => {
      // 16px Padding Top + Header Height
      const startPos = 16 + e.nativeEvent.layout.height;
      initActionPos.value = startPos;
      setActionStartPos(startPos);
    },
    [initActionPos],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      onScroll(e);
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

  const statusBarShadowVisibility = useAnimatedStyle(() => ({
    opacity: clamp(scrollAmount.value / (initActionPos.value - 40), 0, 1),
  }));

  return (
    <>
      <AnimatedFlashList
        ref={listRef}
        {...layoutListeners}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <LayoutHeader
            onLayout={calcInitStartPos}
            style={[
              StickyAction ? { marginBottom: estimatedActionSize + 24 } : {},
            ]}
          >
            {t(titleKey)}
          </LayoutHeader>
        }
        {...props}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomInset.withNav + 16 - insetDelta,
        }}
      />
      <Scrollbar
        disabled={!isVisible}
        topOffset={actionStartPos}
        bottomOffset={bottomInset.withNav + 16 - insetDelta}
        scrollAmount={scrollPosition}
      />

      {/* Render shadow under status bar when title is off-screen. */}
      <Animated.View
        pointerEvents="none"
        style={[{ height: top + 56 }, statusBarShadowVisibility]}
        className="absolute left-0 right-0 top-0"
      >
        <LinearGradient
          colors={[`${canvas}FF`, `${canvas}00`]}
          locations={[top / (top + 56), 1]}
          pointerEvents="none"
          className="h-full"
        />
      </Animated.View>
      {StickyAction ? (
        <Animated.View
          entering={FadeIn}
          pointerEvents="box-none"
          style={[{ maxWidth: ScreenWidth - 32 }, actionOffset]}
          className="absolute right-4 z-50"
        >
          {StickyAction}
        </Animated.View>
      ) : null}
    </>
  );
}

function LayoutHeader({
  style,
  ...props
}: Pick<TextProps, "children" | "onLayout" | "style">) {
  const { top } = useSafeAreaInsets();
  return (
    <AccentText
      style={[{ paddingTop: top + 16 }, style]}
      className="pb-6 text-4xl"
      {...props}
    />
  );
}
