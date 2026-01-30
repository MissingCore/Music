import type { LegendListProps } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { View } from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";

import { cn } from "~/lib/style";
import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import { SafeContainer } from "~/components/SafeContainer";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";

const INVALID_STATE = -1;
const SNAP_PERCENT = 0.2;
const VELOCITY_FACTOR = 5;

const SHADOW_HEIGHT = 24;

export function NScrollListLayout<TData>({
  titleKey,
  OptionsSheet,
  ...props
}: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  titleKey?: ParseKeys;
  OptionsSheet?: (props: { ref: TrueSheetRef }) => React.JSX.Element;
}) {
  const { surface } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomActionsInset();
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const internalListRef = useAnimatedLegendListRef();

  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();

  const [headerHeight, setHeaderHeight] = useState(0);
  const dragOffsetYStart = useSharedValue(INVALID_STATE);
  const prevOffsetY = useSharedValue(0);
  const headerTranslation = useSharedValue(0);

  const measureHeader = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      onScroll(e);

      //? Handle header position in relation to scroll.
      const changeDelta = e.contentOffset.y - prevOffsetY.value;
      // Add velocity as a bonus after the header is away from it's initial position.
      const bonus = e.contentOffset.y < headerHeight ? 0 : VELOCITY_FACTOR;
      const velocityBonus = (e.velocity?.y ?? 0) * bonus;

      headerTranslation.value = clamp(
        0,
        headerTranslation.value + changeDelta + velocityBonus,
        headerHeight,
      );

      prevOffsetY.value = e.contentOffset.y;
    },
    onBeginDrag: (e) => {
      dragOffsetYStart.value = e.contentOffset.y;
    },
    onMomentumEnd: (e) => {
      //? Snap the header to a position after scrolling has stopped.
      const changeDelta = dragOffsetYStart.value - e.contentOffset.y;
      dragOffsetYStart.value = INVALID_STATE;

      if (changeDelta > headerHeight * SNAP_PERCENT) {
        // Snap header open if we scroll up a bit.
        headerTranslation.value = withSpring(0);
      } else if (e.contentOffset.y > headerHeight) {
        // Only snap "close" if header can be fully out of view.
        headerTranslation.value = withSpring(headerHeight);
      }
    },
  });

  const topOffset = SHADOW_HEIGHT + headerHeight;

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -headerTranslation.value }],
  }));

  return (
    <View className="relative flex-1">
      {titleKey && OptionsSheet ? (
        <NScrollListHeader
          titleKey={titleKey}
          OptionsSheet={OptionsSheet}
          onLayout={measureHeader}
          style={headerStyle}
          className="absolute top-0 left-0 z-50 w-full"
        />
      ) : null}

      <AnimatedLegendList
        ref={internalListRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        maintainVisibleContentPosition={false}
        {...props}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: topOffset,
          paddingBottom: bottomInset.withNav + 16,
        }}
      />
      <LinearGradient
        colors={[`${surface}FF`, `${surface}00`]}
        locations={[insets.top / headerHeight, 1]}
        pointerEvents="none"
        style={{ height: topOffset }}
        className="absolute top-0 left-0 w-full"
      />
      <Scrollbar
        key={props.numColumns}
        listRef={internalListRef}
        scrollbarOffset={{ top: topOffset, bottom: bottomInset.withNav + 16 }}
        isVisible={quickScroll}
        {...layoutInfo}
      />
    </View>
  );
}

/** Accompanying header for `NScrollListLayout`. */
export function NScrollListHeader(props: {
  titleKey: ParseKeys;
  OptionsSheet: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  onLayout?: (e: LayoutChangeEvent) => void;
  style?: AnimatedStyle<ViewStyle>;
  className?: string;
  /** Wrap additional "actions" which will appear before the "Screen Options" button. */
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { surface } = useTheme();
  const sheetRef = useSheetRef();

  const IconButtonComponent = useMemo(
    () => (props.children ? IconButton : FilledIconButton),
    [props.children],
  );

  return (
    <>
      <props.OptionsSheet ref={sheetRef} />
      <Animated.View style={props.style} className={props.className}>
        <SafeContainer
          additionalTopOffset={24}
          onLayout={props.onLayout}
          className="bg-surface p-4 pb-0"
        >
          <View className="flex-row items-center justify-between gap-4">
            <Marquee>
              <AccentText className="text-4xl">{t(props.titleKey)}</AccentText>
            </Marquee>
            <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
              {props.children}
              <IconButtonComponent
                Icon={MoreHoriz}
                accessibilityLabel={t("feat.modalViewPreference.title")}
                onPress={() => sheetRef.current?.present()}
                size="sm"
              />
            </View>
          </View>
        </SafeContainer>
        <LinearGradient
          colors={[`${surface}E6`, `${surface}00`]}
          pointerEvents="none"
          style={{ height: SHADOW_HEIGHT }}
          className="w-full"
        />
      </Animated.View>
    </>
  );
}
