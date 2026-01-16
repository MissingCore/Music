import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  clamp,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";
import { useBottomActionsInset } from "../hooks/useBottomActions";

import { AnimatedScrollView } from "~/components/Defaults";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import { AccentText } from "~/components/Typography/AccentText";

/** Layout with a title, interactive scrollbar, and renders content with standardized spacing. */
export function HomeScrollListLayout(props: {
  /** Key to title in translations. */
  titleKey: ParseKeys;
  /** Action rendered adjacent to the title. */
  titleAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomActionsInset();
  const { surface } = useTheme();
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const scrollRef = useAnimatedRef();

  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();

  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollAmount = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      onScroll(e);
      scrollAmount.value = e.contentOffset.y;
    },
  });

  const statusBarShadowVisibility = useAnimatedStyle(() => ({
    opacity: clamp(scrollAmount.value / headerHeight || 0, 0, 1),
  }));

  return (
    <>
      <AnimatedScrollView
        // @ts-expect-error - We can pass refs since React 19.
        ref={scrollRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingBottom: bottomInset.withNav + 16 }}
        contentContainerClassName="grow gap-6 p-4"
      >
        <LayoutHeader
          titleKey={props.titleKey}
          titleAction={props.titleAction}
          getHeaderHeight={setHeaderHeight}
        />
        {props.children}
      </AnimatedScrollView>
      <Scrollbar
        listRef={scrollRef}
        scrollbarOffset={{
          // Extra `24px` because the gap isn't included.
          top: 16 + headerHeight + 24,
          bottom: bottomInset.withNav + 16,
        }}
        isVisible={quickScroll}
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
    </>
  );
}

function LayoutHeader(props: {
  titleKey: ParseKeys;
  titleAction?: React.ReactNode;
  getHeaderHeight?: (height: number) => void;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    <View
      onLayout={({ nativeEvent: { layout } }) => {
        if (props.getHeaderHeight) props.getHeaderHeight(layout.height);
      }}
      style={{ paddingTop: top + 16 }}
      className="flex-row items-center justify-between gap-4"
    >
      <AccentText className="text-4xl">{t(props.titleKey)}</AccentText>
      {props.titleAction ? (
        <View className="-mr-2">{props.titleAction}</View>
      ) : undefined}
    </View>
  );
}
