import type { FlashList, FlashListProps } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback } from "react";
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

import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useTheme } from "~/hooks/useTheme";

import { AnimatedFlashList } from "~/components/Defaults";
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
  ...props
}: FlashListProps<TData> & {
  /** Key to title in translations. */
  titleKey: ParseKeys;
  /** Optional action displayed in layout. */
  StickyAction?: React.JSX.Element;
  /** Height of the StickyAction. */
  estimatedActionSize?: number;
  /** Pass a ref to the animated FlashList. */
  listRef?: React.Ref<FlashList<any>>;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { width: ScreenWidth } = useWindowDimensions();
  const { bottomInset } = useBottomActionsContext();
  const { canvas } = useTheme();

  const initActionPos = useSharedValue(0);
  const scrollAmount = useSharedValue(0);

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

  const statusBarShadowVisibility = useAnimatedStyle(() => ({
    opacity: clamp(scrollAmount.value / (initActionPos.value - 40), 0, 1),
  }));

  return (
    <>
      <AnimatedFlashList
        ref={listRef}
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
          paddingBottom: bottomInset.withNav + 16,
        }}
      />

      {/* Render shadow under status bar when title is off-screen. */}
      <Animated.View
        pointerEvents="none"
        style={[{ height: top + 56 }, statusBarShadowVisibility]}
        className="absolute left-0 right-0 top-0"
      >
        <LinearGradient
          colors={[`${canvas}FF`, `${canvas}00`]}
          locations={[0.2, 1]}
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
