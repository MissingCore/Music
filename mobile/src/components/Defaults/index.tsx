import type { LegendListProps, LegendListRef } from "@legendapp/list";
import { LegendList as RawLegendList } from "@legendapp/list";
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
