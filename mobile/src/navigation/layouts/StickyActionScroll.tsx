import type { LegendListProps } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";
import { useBottomActionsInset } from "../hooks/useBottomActions";

import type { AnimatedLegendListRef } from "~/components/Defaults";
import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
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
}: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  /** Key to title in translations. */
  titleKey: ParseKeys;
  /** Optional action displayed in layout. */
  StickyAction?: React.JSX.Element;
  /** Height of the StickyAction. */
  estimatedActionSize?: number;
  /** Pass a ref to the animated FlashList. */
  listRef?: AnimatedLegendListRef;
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
  const { surface } = useTheme();
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const internalListRef = useAnimatedLegendListRef();
  // @ts-expect-error - Should be able to synchronize refs.
  useImperativeHandle(listRef, () => internalListRef.current);

  const [actionStartPos, setActionStartPos] = useState(0);
  const initActionPos = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();

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
      <AnimatedLegendList
        ref={internalListRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <AccentText
            onLayout={calcInitStartPos}
            style={[
              { paddingTop: top + 16 },
              StickyAction && { marginBottom: estimatedActionSize + 24 },
            ]}
            className="pb-6 text-4xl"
          >
            {t(titleKey)}
          </AccentText>
        }
        maintainVisibleContentPosition={false}
        {...props}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomInset.withNav + 16 - insetDelta,
        }}
      />
      <Scrollbar
        listRef={internalListRef}
        scrollbarOffset={{
          top: actionStartPos,
          bottom: bottomInset.withNav + 16 - insetDelta,
        }}
        isVisible={showScrollbar && quickScroll}
        {...layoutInfo}
      />

      {/* Render shadow under status bar when title is off-screen. */}
      <Animated.View
        pointerEvents="none"
        style={[{ height: top + 56 }, statusBarShadowVisibility]}
        className="absolute top-0 right-0 left-0"
      >
        <LinearGradient
          colors={[`${surface}FF`, `${surface}00`]}
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
