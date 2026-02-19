import type {
  LegendListRef as RawLegendListRef,
  LegendListRenderItemProps,
} from "@legendapp/list";
import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { memo, useRef } from "react";
import type { AnimatedRef } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import { withUniwind } from "uniwind";

type LegendListSignature = <T>(props: LegendListProps<T>) => React.JSX.Element;

type JoinedLegendListRef = LegendListRef | AnimatedLegendListRef;

export type LegendListRef = React.RefObject<RawLegendListRef | null>;
// @ts-expect-error - Argument should be compatible.
export type AnimatedLegendListRef = AnimatedRef<RawLegendListRef>;

export type LegendListProps<T = any> = Omit<
  Omit<AnimatedLegendListProps<T>, "ref">,
  "data"
> & { ref?: JoinedLegendListRef; data?: readonly T[] };

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
  return useRef<RawLegendListRef>(null);
}
export function useAnimatedLegendListRef() {
  return useAnimatedRef() as unknown as AnimatedLegendListRef;
}
