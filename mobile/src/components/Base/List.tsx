import { memo } from "react";
import type { FlatListPropsWithLayout } from "react-native-reanimated";
import Animated from "react-native-reanimated";

type AnimatedListSignature = <T>(
  props: FlatListPropsWithLayout<T> & { ref?: AnimatedListRef },
) => React.JSX.Element;

export type AnimatedListRef = React.RefObject<Animated.FlatList | null>;

export const AnimatedList = memo(function AnimatedList(props) {
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
}) as AnimatedListSignature;
