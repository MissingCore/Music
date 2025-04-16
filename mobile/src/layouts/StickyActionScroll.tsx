import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import type { ParseKeys } from "i18next";
import { useCallback, useEffect } from "react";
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

import { AnimatedLegendList, useLegendListRef } from "~/components/Defaults";
import { AccentText } from "~/components/Typography/AccentText";

/**
 * Legend List layout with optional action component that gets stickied
 * after scrolling.
 */
export function StickyActionListLayout<TData>({
  titleKey,
  StickyAction,
  estimatedActionSize = 0,
  resetScrollPositionOnDataChange = false,
  ...props
}: AnimatedLegendListProps<TData> & {
  /** Key to title in translations. */
  titleKey: ParseKeys;
  /** Optional action displayed in layout. */
  StickyAction?: React.JSX.Element;
  /** Height of the StickyAction. */
  estimatedActionSize?: number;
  /** Reset scroll position when data changes. */
  resetScrollPositionOnDataChange?: boolean;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { width: ScreenWidth } = useWindowDimensions();
  const { bottomInset } = useBottomActionsContext();
  const listRef = useLegendListRef();

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

  useEffect(() => {
    if (resetScrollPositionOnDataChange) {
      listRef.current?.scrollToOffset({ offset: 0 });
    }
  }, [listRef, props.data, resetScrollPositionOnDataChange]);

  return (
    <>
      <AnimatedLegendList
        // @ts-expect-error - Ref should be compatible with Animated Legend List.
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

function LayoutHeader(
  props: Pick<TextProps, "children" | "onLayout" | "style">,
) {
  const { top } = useSafeAreaInsets();
  return (
    <AccentText
      onLayout={props.onLayout}
      style={[{ paddingTop: top + 16 }, props.style]}
      className="pb-6 text-4xl"
    >
      {props.children}
    </AccentText>
  );
}
