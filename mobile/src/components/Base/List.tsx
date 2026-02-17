import { memo, useRef } from "react";
import type { FlatListPropsWithLayout } from "react-native-reanimated";
import Animated from "react-native-reanimated";

type FlatListSignature = <T>(
  props: FlatListPropsWithLayout<T> & { ref?: FlatListRef },
) => React.JSX.Element;

export type FlatListRef<T = any> = React.RefObject<Animated.FlatList<T> | null>;
export type FlatListProps<T = any> = FlatListPropsWithLayout<T>;

export const FlatList = memo(function AnimatedList(props) {
  return (
    <Animated.FlatList
      removeClippedSubviews
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      windowSize={7} // We don't need that many screens rendered on mount.
      {...props}
    />
  );
}) as FlatListSignature;

export function useFlatListRef() {
  return useRef<Animated.FlatList>(null);
}
