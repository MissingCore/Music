import type { LegendListProps, LegendListRef } from "@legendapp/list";
import { LegendList as RawLegendList } from "@legendapp/list";
import { AnimatedLegendList as RawAnimatedLegendList } from "@legendapp/list/reanimated";
import { cssInterop } from "nativewind";
import type { ForwardedRef } from "react";
import { forwardRef, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ScrollViewProps } from "react-native";
import { ScrollView as RNScrollView } from "react-native";
import type { FlashDragListProps } from "react-native-draglist/dist/FlashList";
import RNFlashDragList from "react-native-draglist/dist/FlashList";

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

type AnimatedLegendListSignature = typeof RawAnimatedLegendList;
const WrappedAnimatedLegendList = cssInterop(RawAnimatedLegendList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
}) as AnimatedLegendListSignature;

function LegendListImpl<T>(
  {
    extraData,
    recycleItems = true,
    animated,
    ...props
  }: LegendListProps<T> & { animated?: boolean },
  ref?: ForwardedRef<LegendListRef>,
) {
  const { i18n } = useTranslation();

  const dependencies = useMemo(
    () => [i18n.language, extraData],
    [i18n.language, extraData],
  );

  const ListComponent = useMemo(
    () => (animated ? WrappedAnimatedLegendList : WrappedLegendList),
    [animated],
  );

  return (
    <ListComponent
      // @ts-expect-error - Ref should be compatible with Animated Legend List.
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

/** Animated Legend List supporting NativeWind styles. */
export const AnimatedLegendList = forwardRef(
  function AnimatedLegendList(props, ref) {
    // @ts-expect-error - `animated` prop should be "hidden" from use.
    return <LegendList ref={ref} {...props} animated />;
  },
) as AnimatedLegendListSignature;

export function useLegendListRef() {
  return useRef<LegendListRef>(null);
}
//#endregion

//#region Flash Drag List
/** `<FlashDragList />` with some defaults. */
export function FlashDragList<TData>(props: FlashDragListProps<TData>) {
  return <RNFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion
