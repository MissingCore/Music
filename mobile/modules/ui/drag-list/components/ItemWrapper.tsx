import { memo } from "react";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { INACTIVE, useDragListStore } from "../core/store";

type Props = {
  index: number;
  children: React.ReactNode;
};

export const ItemWrapper = memo(function ItemWrapper({
  index,
  children,
}: Props) {
  const estimatedItemSize = useDragListStore((s) => s.estimatedItemSize);
  const activeIndex = useDragListStore((s) => s.activeIndex);
  const pan = useDragListStore((s) => s.pan);
  const shifted = useDragListStore((s) => s.shifted);
  const itemPan = useSharedValue(0);

  useAnimatedReaction(
    () => pan.get(),
    (currVal) => {
      if (activeIndex.get() === INACTIVE) itemPan.set(0);
      else if (index === activeIndex.get()) itemPan.set(currVal);
      else {
        // Direction item will be moved.
        const dir = currVal < 0 ? 1 : -1;

        //? If we get a negative number, item is in path of current pan direction.
        const relToOGPos = dir * (index - activeIndex.get());
        //? If we get a non-negative number, item may have been moved.
        const relToShiftedPos =
          dir * (index - (activeIndex.get() + shifted.get()));

        itemPan.set(
          relToOGPos < 0 && relToShiftedPos >= 0
            ? withSpring(dir * estimatedItemSize)
            : withSpring(0),
        );
      }
    },
  );

  const styles = useAnimatedStyle(() => ({
    zIndex: index === activeIndex.get() ? 100 : 0,
    transform: [{ translateY: itemPan.get() }],
  }));

  return <Animated.View style={styles}>{children}</Animated.View>;
});
