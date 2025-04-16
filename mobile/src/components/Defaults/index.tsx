import type { LegendListProps, LegendListRef } from "@legendapp/list";
import { LegendList as RawLegendList } from "@legendapp/list";
import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { AnimatedLegendList as RawAnimatedLegendList } from "@legendapp/list/reanimated";
import { cssInterop } from "nativewind";
import type { ForwardedRef } from "react";
import { forwardRef, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ScrollViewProps } from "react-native";
import { ScrollView as RNScrollView } from "react-native";

/** Presets for scrollview-like components. */
export const ScrollablePresets = {
  overScrollMode: "never",
  showsHorizontalScrollIndicator: false,
  showsVerticalScrollIndicator: false,
} satisfies ScrollViewProps;

//#region Scroll View
export function ScrollView(props: ScrollViewProps) {
  return <RNScrollView {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Legend List
type LegendListSignature = typeof RawLegendList;

const WrappedLegendList = cssInterop(RawLegendList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
}) as LegendListSignature;

function LegendListImpl<T>(
  { extraData, recycleItems = true, ...props }: LegendListProps<T>,
  ref?: ForwardedRef<LegendListRef>,
) {
  const { i18n } = useTranslation();

  const dependencies = useMemo(
    () => [i18n.language, extraData],
    [i18n.language, extraData],
  );

  return (
    <WrappedLegendList
      ref={ref}
      {...ScrollablePresets}
      extraData={dependencies}
      recycleItems={recycleItems}
      {...props}
    />
  );
}

/** Legend List supporting NativeWind styles. */
export const LegendList = forwardRef(LegendListImpl) as LegendListSignature;

export function useLegendListRef() {
  return useRef<LegendListRef>(null);
}
//#endregion

//#region Animated Legend List
type AnimatedLegendListSignature = typeof RawAnimatedLegendList;

const WrappedAnimatedLegendList = cssInterop(RawAnimatedLegendList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
}) as AnimatedLegendListSignature;

function AnimatedLegendListImpl<T>(
  { extraData, recycleItems = true, ...props }: AnimatedLegendListProps<T>,
  ref?: ForwardedRef<LegendListRef>,
) {
  const { i18n } = useTranslation();

  const dependencies = useMemo(
    () => [i18n.language, extraData],
    [i18n.language, extraData],
  );

  return (
    <WrappedAnimatedLegendList
      // @ts-expect-error - Ref should be compatible with Animated Legend List.
      ref={ref}
      {...ScrollablePresets}
      extraData={dependencies}
      recycleItems={recycleItems}
      {...props}
    />
  );
}

/** Animated Legend List supporting NativeWind styles. */
export const AnimatedLegendList = forwardRef(
  AnimatedLegendListImpl,
) as AnimatedLegendListSignature;
//#endregion
