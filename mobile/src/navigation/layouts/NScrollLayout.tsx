import type { ParseKeys } from "i18next";
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import type { AnimatedStyle, ScrollHandler } from "react-native-reanimated";
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
import { scheduleOnUI } from "react-native-worklets";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { usePreferenceStore } from "~/stores/Preference/store";

import {
  BottomActionsOffset,
  useBottomActionsOffset,
} from "~/navigation/components/BottomActions/useBottomActions";

import type {
  AnimatedLegendListRef,
  LegendListProps,
} from "~/components/Base/LegendList";
import {
  LegendList,
  useAnimatedLegendListRef,
} from "~/components/Base/LegendList";
import {
  ScrollView,
  useAnimatedScrollViewRef,
} from "~/components/Base/ScrollView";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { Marquee } from "~/components/Marquee";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";

const INVALID_STATE = -1;
const SNAP_PERCENT = 0.35;

//? Includes the shadow underneath the header, but doesn't include the top insets.
const ESTIMATE_HEADER_HEIGHT = 101.5;
const SHADOW_HEIGHT = 24;

//#region NScrollLayout
/** ScrollView with "shy header" and `NScrollbar`. */
export function NScrollLayout(props: {
  titleKey: ParseKeys;
  Actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedScrollViewRef();

  // NScrollbar
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const scrollBarContext = useScrollbarContext();

  const bottomOffset = useBottomActionsOffset(
    16 + (showNavbar ? BottomActionsOffset : 0),
    showNavbar ? -8 : 0,
  );

  // Shy Header
  const [topBarHeight, setTopBarHeight] = useState(
    ESTIMATE_HEADER_HEIGHT + insets.top,
  );
  const headerHeight = topBarHeight - SHADOW_HEIGHT;

  const shyHeaderContext = useShyHeaderContext({
    headerHeight,
    NScrollBarOnScroll: scrollBarContext.onScroll,
  });

  return (
    <View className="relative flex-1">
      <ShyHeader
        titleKey={props.titleKey}
        getTrueHeight={setTopBarHeight}
        style={shyHeaderContext.headerStyle}
        Actions={props.Actions}
      />

      <ScrollView
        ref={scrollRef}
        {...scrollBarContext.layoutHandlers}
        onScroll={shyHeaderContext.scrollHandler}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: topBarHeight,
          paddingBottom: bottomOffset,
        }}
        contentContainerClassName="grow gap-6"
      >
        {props.children}
      </ScrollView>

      <TopDownGradient
        height={topBarHeight}
        startFrom={insets.top}
        className="absolute top-0 left-0"
      />
      <Scrollbar
        listRef={scrollRef}
        scrollbarOffset={{ top: topBarHeight, bottom: bottomOffset }}
        isVisible={quickScroll}
        {...scrollBarContext.layoutInfo}
        onEnd={shyHeaderContext.onNScrollGestureEnd}
      />
    </View>
  );
}
//#endregion

//#region NScrollListLayout
/** LegendList with "shy header" and `NScrollbar`. */
export function NScrollListLayout<TData>({
  titleKey,
  listRef,
  OptionsSheet,
  Actions,
  Subheader,
  estimatedSubheaderHeight = 0,
  ...props
}: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  titleKey: ParseKeys;
  listRef?: AnimatedLegendListRef;
  OptionsSheet?: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  /** Additional "actions" which will appear before the "Screen Options" button. */
  Actions?: React.ReactNode;
  /** Component rendered after the header but before the shadow. */
  Subheader?: React.ReactNode;
  /** Estimated height of subheader to improve "initial" height calculations. */
  estimatedSubheaderHeight?: number;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const internalListRef = useAnimatedLegendListRef();
  // @ts-expect-error - Should be able to synchronize refs.
  useImperativeHandle(listRef, () => internalListRef.current);
  const sheetRef = useSheetRef();

  // NScrollbar
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const scrollBarContext = useScrollbarContext();

  const bottomOffset = useBottomActionsOffset(
    16 + (showNavbar ? BottomActionsOffset : 0),
    showNavbar ? -8 : 0,
  );

  // Shy Header
  const [topBarHeight, setTopBarHeight] = useState(
    ESTIMATE_HEADER_HEIGHT + insets.top + estimatedSubheaderHeight,
  );
  const headerHeight = topBarHeight - SHADOW_HEIGHT;

  const shyHeaderContext = useShyHeaderContext({
    headerHeight,
    NScrollBarOnScroll: scrollBarContext.onScroll,
    resetOn: props.numColumns,
  });

  const RenderedHeaderActions = useMemo(() => {
    if (!Actions && !OptionsSheet) return null;
    return (
      <>
        {Actions}
        <FilledIconButton
          Icon={MoreHoriz}
          accessibilityLabel={t("feat.modalViewPreference.title")}
          onPress={() => sheetRef.current?.present()}
        />
      </>
    );
  }, [t, Actions, OptionsSheet, sheetRef]);

  return (
    <View className="relative flex-1">
      {OptionsSheet ? <OptionsSheet ref={sheetRef} /> : null}
      <ShyHeader
        titleKey={titleKey}
        getTrueHeight={setTopBarHeight}
        style={shyHeaderContext.headerStyle}
        Actions={RenderedHeaderActions}
      >
        {Subheader}
      </ShyHeader>

      <LegendList
        ref={internalListRef}
        {...scrollBarContext.layoutHandlers}
        onScroll={shyHeaderContext.scrollHandler}
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
        key={Number(props.numColumns)}
        listRef={internalListRef}
        scrollbarOffset={{ top: topBarHeight, bottom: bottomOffset }}
        isVisible={quickScroll}
        {...scrollBarContext.layoutInfo}
        onEnd={shyHeaderContext.onNScrollGestureEnd}
      />
    </View>
  );
}
//#endregion

//#region "Shy" Header
function ShyHeader(props: {
  titleKey: ParseKeys;
  getTrueHeight: (height: number) => void;
  style: AnimatedStyle<ViewStyle>;
  Actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState(
    ESTIMATE_HEADER_HEIGHT + insets.top,
  );

  return (
    <Animated.View
      onLayout={(e) => {
        props.getTrueHeight(e.nativeEvent.layout.height);
        setContainerHeight(e.nativeEvent.layout.height);
      }}
      pointerEvents="box-none"
      style={props.style}
      className="absolute top-0 left-0 z-50 w-full"
    >
      {/*
        We previously had the shadow after the main header content, but we
        encountered a problem where you can see a seam between the content &
        shadow when the header animated down.
      */}
      <TopDownGradient
        height={containerHeight}
        startFrom={containerHeight - SHADOW_HEIGHT}
        className="absolute top-0 left-0"
      />
      <View
        collapsable={false}
        style={{ paddingTop: insets.top + 32, marginBottom: SHADOW_HEIGHT }}
        className="px-4"
      >
        <View className="flex-row items-center justify-between gap-4">
          <Marquee>
            <AccentText>{t(props.titleKey)}</AccentText>
          </Marquee>
          {props.Actions ? (
            <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
              {props.Actions}
            </View>
          ) : null}
        </View>
        {props.children}
      </View>
    </Animated.View>
  );
}
//#endregion

//#region useShyHeaderContext
function useShyHeaderContext(args: {
  headerHeight: number;
  /** The `onScroll` function returned by `useScrollbarContext()`. */
  NScrollBarOnScroll: ScrollHandler;
  /** Value to trigger a reset in our logic. */
  resetOn?: any;
}) {
  //#region Header Components
  const headerTranslation = useSharedValue(0);
  const translationTimer = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -headerTranslation.get() }],
    opacity: clamp(
      (args.headerHeight - headerTranslation.get()) / args.headerHeight,
      0,
      1,
    ),
  }));

  // Reset `headerTranslation` when the layout changes.
  const resetTriggerValue = useRef(args.resetOn);
  if (resetTriggerValue.current !== args.resetOn) {
    resetTriggerValue.current = args.resetOn;
    scheduleOnUI(() => {
      headerTranslation.set(0);
      cancelAnimation(translationTimer);
      translationTimer.set(0);
    });
  }
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
        translationTimer.set(0);
        //? `withSpring` might make `headerTranslation` briefly not `0`.
        wasSnapped.set(headerTranslation.get() < 16);
        dragOffsetYStart.set(offsetY);
      },
      // Handle snapping the header when scrolling stops.
      onComplete: (offsetY: number) => {
        "worklet";
        translationTimer.set(0);
        //? Snap the header to a position after scrolling has stopped.
        const changeDelta = dragOffsetYStart.get() - offsetY;
        const snapThreshold = args.headerHeight * SNAP_PERCENT;
        dragOffsetYStart.set(INVALID_STATE);

        // Only snap when not at the beginning of the list where the header
        // should be fully visible.
        if (
          offsetY > args.headerHeight ||
          // For the case where we scroll enough to snap, but stopped within the beginning of the list.
          offsetY + changeDelta > args.headerHeight
        ) {
          if (wasSnapped.get() && Math.abs(changeDelta) <= snapThreshold) {
            // Keep header snapped if already snapped and didn't meet the threshold.
            headerTranslation.set(withSpring(0));
          } else if (changeDelta > snapThreshold) {
            // Snap header open if we meet the threshold.
            headerTranslation.set(withSpring(0));
          } else {
            headerTranslation.set(
              withSpring(Math.min(args.headerHeight, offsetY)),
            );
          }
        } else if (changeDelta < 0) {
          // Snap header to `offset` when scrolling down if within the header height.
          headerTranslation.set(withSpring(offsetY));
        }

        wasSnapped.set(false);
      },
    }),
    [
      args.headerHeight,
      headerTranslation,
      translationTimer,
      wasSnapped,
      dragOffsetYStart,
    ],
  );

  // Handle snapping the header when we stop scrolling via `NScrollbar`.
  const onNScrollGestureEnd = useCallback(() => {
    "worklet";
    translationTimer.set(
      withTiming(1, { duration: 150 }, (isDone) => {
        if (isDone) snapHandlers.onComplete(prevOffsetY.get());
      }),
    );
  }, [snapHandlers, translationTimer, prevOffsetY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e, _ctx) => {
      args.NScrollBarOnScroll(e, _ctx);

      //? Handle situation where we scroll via `NScrollbar` (as `onBeginDrag`
      //? doesn't get fired).
      if (dragOffsetYStart.get() === INVALID_STATE) {
        snapHandlers.onInit(e.contentOffset.y);
      }

      //? Handle header position in relation to scroll.
      const changeDelta = e.contentOffset.y - prevOffsetY.get();
      headerTranslation.set(
        clamp(headerTranslation.get() + changeDelta, 0, args.headerHeight),
      );

      prevOffsetY.set(e.contentOffset.y);

      //? Reset timer if somehow `onScroll` was fired after the `NScrollbar` gesture completed.
      if (translationTimer.get() !== 0) {
        cancelAnimation(translationTimer);
        translationTimer.set(0);
        translationTimer.set(
          withTiming(1, { duration: 150 }, (isDone) => {
            if (isDone) snapHandlers.onComplete(e.contentOffset.y);
          }),
        );
      }
    },
    onBeginDrag: (e) => snapHandlers.onInit(e.contentOffset.y),
    onMomentumEnd: (e) => snapHandlers.onComplete(e.contentOffset.y),
  });
  //#endregion

  return useMemo(
    () => ({ headerStyle, scrollHandler, onNScrollGestureEnd }),
    [headerStyle, scrollHandler, onNScrollGestureEnd],
  );
}
//#endregion
