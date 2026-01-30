import type { LegendListProps } from "@legendapp/list";
import type { ParseKeys } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
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

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";

import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { Marquee } from "~/components/Marquee";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";

const INVALID_STATE = -1;
const SNAP_PERCENT = 0.2;
const VELOCITY_FACTOR = 5;

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
  const [topBarHeight, setTopBarHeight] = useState(0); //? Includes the shadow underneath the header.
  const headerHeight = useMemo(
    () => topBarHeight - SHADOW_HEIGHT,
    [topBarHeight],
  );

  const headerTranslation = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -headerTranslation.value }],
  }));

  const IconButtonComponent = useMemo(
    () => (Actions ? IconButton : FilledIconButton),
    [Actions],
  );
  //#endregion

  //#region Scroll Animations
  const dragOffsetYStart = useSharedValue(INVALID_STATE);
  const prevOffsetY = useSharedValue(0);

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
  //#endregion

  return (
    <View className="relative flex-1">
      <OptionsSheet ref={sheetRef} />
      <Animated.View
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}
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
            <IconButtonComponent
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
      />
    </View>
  );
}
