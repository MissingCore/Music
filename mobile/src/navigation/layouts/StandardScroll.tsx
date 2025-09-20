import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "~/hooks/useTheme";
import { useBottomActionsInset } from "../hooks/useBottomActions";

import { cn } from "~/lib/style";
import { AnimatedScrollView } from "~/components/Defaults";
import { AccentText } from "~/components/Typography/AccentText";

/** Standard scrollable layout with an option to display a title. */
export function StandardScrollLayout(props: {
  children: React.ReactNode;
  contentContainerClassName?: string;
  /** Key to title in translations. */
  titleKey?: ParseKeys;
  /** Action rendered adjacent to the title. */
  titleAction?: React.ReactNode;
  /** Only takes effect if this is `true` & `titleKey` is provided. */
  showStatusBarShadow?: boolean;
}) {
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomActionsInset();
  const { canvas } = useTheme();

  const headerHeight = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollAmount.value = e.contentOffset.y;
    },
  });

  const statusBarShadowVisibility = useAnimatedStyle(() => {
    if (!props.titleKey || !props.showStatusBarShadow) return { opacity: 0 };
    return {
      opacity: clamp(scrollAmount.value / headerHeight.value || 0, 0, 1),
    };
  });

  return (
    <>
      <AnimatedScrollView
        onScroll={scrollHandler}
        contentContainerStyle={
          props.titleKey
            ? { paddingBottom: bottomInset.withNav + 16 }
            : undefined
        }
        contentContainerClassName={cn(
          "grow gap-6 p-4",
          props.contentContainerClassName,
        )}
      >
        {props.titleKey ? (
          <LayoutHeader
            titleKey={props.titleKey}
            titleAction={props.titleAction}
            getHeaderHeight={(height) => {
              headerHeight.value = height;
            }}
          />
        ) : undefined}
        {props.children}
      </AnimatedScrollView>

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
