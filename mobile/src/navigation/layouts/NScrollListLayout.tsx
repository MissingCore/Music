import type { LegendListProps } from "@legendapp/list";
import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { usePreferenceStore } from "~/stores/Preference/store";

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";

import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { Marquee } from "~/components/Marquee";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";

const INVALID_STATE = -1;
const SNAP_PERCENT = 0.35;

const SHADOW_HEIGHT = 48;

export function NScrollListLayout<TData>({
  titleKey,
  OptionsSheet,
  Actions,
  ...props
}: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  titleKey: ParseKeys;
  OptionsSheet: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  /** Additional "actions" which will appear before the "Screen Options" button. */
  Actions?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomActionsInset();
  const internalListRef = useAnimatedLegendListRef();
  const sheetRef = useSheetRef();

  //#region NScrollbar
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();

  const bottomOffset = bottomInset.withNav + 16;
  //#endregion

  //#region Header Components
  const [topBarHeight, setTopBarHeight] = useState(154); //? Includes the shadow underneath the header.
  const headerHeight = useMemo(
    () => topBarHeight - SHADOW_HEIGHT,
    [topBarHeight],
  );

  const headerTranslation = useSharedValue(0);
  const translationTimer = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -headerTranslation.value }],
  }));

  // Reset `headerTranslation` when the layout changes.
  useEffect(() => {
    headerTranslation.value = 0;
    cancelAnimation(translationTimer);
    translationTimer.value = 0;
  }, [headerTranslation, translationTimer, props.numColumns]);
  //#endregion

  //#region Scroll Animations
  const wasSnapped = useSharedValue(false);
  const dragOffsetYStart = useSharedValue(INVALID_STATE);
  const prevOffsetY = useSharedValue(0);

  const snapHandlers = useMemo(
    () => ({
      // Initialize values to help determine if we should snap the header.
      onInit: (offsetY: number) => {
        "worklet";
        cancelAnimation(translationTimer);
        translationTimer.value = 0;
        //? `withSpring` might make `headerTranslation` briefly not `0`.
        wasSnapped.value = headerTranslation.value < 16;
        dragOffsetYStart.value = offsetY;
      },
      // Handle snapping the header when scrolling stops.
      onComplete: (offsetY: number) => {
        "worklet";
        translationTimer.value = 0;
        //? Snap the header to a position after scrolling has stopped.
        const changeDelta = dragOffsetYStart.value - offsetY;
        const snapThreshold = headerHeight * SNAP_PERCENT;
        dragOffsetYStart.value = INVALID_STATE;

        // Only snap when not at the beginning of the list where the header
        // should be fully visible.
        if (offsetY > headerHeight) {
          if (wasSnapped.value && Math.abs(changeDelta) <= snapThreshold) {
            // Keep header snapped if already snapped and didn't meet the threshold.
            headerTranslation.value = withSpring(0);
          } else if (changeDelta > snapThreshold) {
            // Snap header open if we meet the threshold.
            headerTranslation.value = withSpring(0);
          } else {
            headerTranslation.value = withSpring(headerHeight);
          }
        }

        wasSnapped.value = false;
      },
    }),
    [
      headerHeight,
      headerTranslation,
      translationTimer,
      wasSnapped,
      dragOffsetYStart,
    ],
  );

  // Handle snapping the header when we stop scrolling via `NScrollbar`.
  const onNScrollGestureEnd = useCallback(() => {
    "worklet";
    translationTimer.value = withTiming(1, { duration: 150 }, (isDone) => {
      if (isDone) snapHandlers.onComplete(prevOffsetY.value);
    });
  }, [snapHandlers, translationTimer, prevOffsetY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      onScroll(e);

      //? Handle situation where we scroll via `NScrollbar` (as `onBeginDrag`
      //? doesn't get fired).
      if (dragOffsetYStart.value === INVALID_STATE) {
        snapHandlers.onInit(e.contentOffset.y);
      }

      //? Handle header position in relation to scroll.
      const changeDelta = e.contentOffset.y - prevOffsetY.value;
      headerTranslation.value = clamp(
        0,
        headerTranslation.value + changeDelta,
        headerHeight,
      );

      prevOffsetY.value = e.contentOffset.y;

      //? Reset timer if somehow `onScroll` was fired after the `NScrollbar` gesture completed.
      if (translationTimer.value !== 0) {
        cancelAnimation(translationTimer);
        translationTimer.value = 0;
        translationTimer.value = withTiming(1, { duration: 150 }, (isDone) => {
          if (isDone) snapHandlers.onComplete(e.contentOffset.y);
        });
      }
    },
    onBeginDrag: (e) => snapHandlers.onInit(e.contentOffset.y),
    onMomentumEnd: (e) => snapHandlers.onComplete(e.contentOffset.y),
  });
  //#endregion

  return (
    <View className="relative flex-1">
      <OptionsSheet ref={sheetRef} />
      <Animated.View
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
        style={headerStyle}
        className="absolute top-0 left-0 z-50 w-full"
      >
        <View
          style={{ paddingTop: insets.top + 32 }}
          className="flex-row items-center justify-between gap-4 bg-surface px-4"
        >
          <Marquee>
            <AccentText className="text-4xl">{t(titleKey)}</AccentText>
          </Marquee>
          <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
            {Actions}
            <FilledIconButton
              Icon={MoreHoriz}
              accessibilityLabel={t("feat.modalViewPreference.title")}
              onPress={() => sheetRef.current?.present()}
              size="sm"
            />
          </View>
        </View>
        <TopDownGradient height={SHADOW_HEIGHT} />
      </Animated.View>

      <AnimatedLegendList
        ref={internalListRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        maintainVisibleContentPosition={false}
        {...props}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: topBarHeight,
          paddingBottom: bottomOffset,
        }}
      />

      <TopDownGradient
        height={topBarHeight}
        startFrom={insets.top}
        className="absolute top-0 left-0"
      />
      <Scrollbar
        key={props.numColumns}
        listRef={internalListRef}
        scrollbarOffset={{ top: topBarHeight, bottom: bottomOffset }}
        isVisible={quickScroll}
        {...layoutInfo}
        onEnd={onNScrollGestureEnd}
      />
    </View>
  );
}
