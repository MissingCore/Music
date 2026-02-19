import type {
  LegendListRef as RawLegendListRef,
  LegendListRenderItemProps,
} from "@legendapp/list";
import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { memo, useRef } from "react";
import { withUniwind } from "uniwind";

type LegendListSignature = <T>(
  props: AnimatedLegendListProps<T> & { ref?: LegendListRef },
) => React.JSX.Element;

export type LegendListRef = React.RefObject<RawLegendListRef | null>;

export type LegendListProps<T = any> = Omit<
  AnimatedLegendListProps<T>,
  "data"
> & { data?: readonly T[] };

export type ListRenderItemInfo<T = any> = LegendListRenderItemProps<T>;

const WrappedAnimatedLegendList = withUniwind(
  AnimatedLegendList,
) as LegendListSignature;

export const LegendList = memo(function LegendList(props) {
  return (
    <WrappedAnimatedLegendList
      key={`list-with-${props.numColumns}-cols`}
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      recycleItems
      {...props}
    />
  );
}) as LegendListSignature;

export function useLegendListRef() {
  return useRef<LegendListRef>(null);
}
