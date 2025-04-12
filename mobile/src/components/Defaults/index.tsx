import type { LegendListProps, LegendListRef } from "@legendapp/list";
import { LegendList as RawLegendList } from "@legendapp/list";
import { cssInterop } from "nativewind";
import type { ForwardedRef } from "react";
import { forwardRef, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ScrollViewProps } from "react-native";

/** Presets for scrollview-like components. */
export const ScrollablePresets = {
  overScrollMode: "never",
  showsHorizontalScrollIndicator: false,
  showsVerticalScrollIndicator: false,
} satisfies ScrollViewProps;

//#region Legend List
const WrappedLegendList = cssInterop(RawLegendList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

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
    // @ts-ignore: TS complains due to `cssInterop` being unable to bring along the generic.
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
export const LegendList = forwardRef(LegendListImpl) as <T>(
  props: LegendListProps<T> & { ref?: ForwardedRef<LegendListRef> },
) => React.JSX.Element;

export function useLegendListRef() {
  return useRef<LegendListRef>(null);
}
//#endregion
