import { useCallback, useMemo, useState } from "react";
import type { FlatListProps, ListRenderItemInfo } from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { ScrollablePresets } from "../Defaults";

export type SheetDragListRenderItemInfo<TData> = {
  item: TData;
  index: number;
  active: boolean;
  isDragging: boolean;
  onInitDrag: VoidFunction;
};

interface SheetDragListProps<TData> extends Pick<
  FlatListProps<TData>,
  | "keyExtractor"
  | "style"
  | "className"
  | "contentContainerStyle"
  | "contentContainerClassName"
> {
  data: TData[];
  renderItem: (info: SheetDragListRenderItemInfo<TData>) => React.ReactElement;
  /** All items should be the same size. Include gap. */
  estimatedItemSize: number;

  /** Called when item captured drag gesture. */
  onDragBegin?: (item: TData, index: number) => void;
  /** Called after the dragged item is dropped. */
  onDragEnd?: VoidFunction;
  /** Called when an item is successfully moved. */
  onReordered: (fromIndex: number, toIndex: number) => void;
}

const INACTIVE = -1;

export function SheetDragList<TData>({
  renderItem,
  estimatedItemSize,
  onDragBegin,
  onDragEnd,
  onReordered,
  ...props
}: SheetDragListProps<TData>) {
  const [enabled, setEnabled] = useState(true);

  const activeIndex = useSharedValue(INACTIVE);
  const [reactiveActiveIndex, setReactiveActiveIndex] = useState(INACTIVE);

  const pan = useSharedValue(0);
  const shifted = useSharedValue(0);

  const onCleanup = useCallback(() => {
    setReactiveActiveIndex(INACTIVE);
    activeIndex.value = INACTIVE;

    pan.value = 0;
    shifted.value = 0;

    setEnabled(true);
  }, [activeIndex, pan, shifted]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          // Bail out of gesture early.
          if (activeIndex.value === INACTIVE) scheduleOnRN(setEnabled, false);
        })
        .onUpdate(({ translationY }) => {
          if (activeIndex.value === INACTIVE) return;
          pan.value = translationY;

          const shiftedAmount = clamp(
            Math.round(translationY / estimatedItemSize),
            -activeIndex.value,
            props.data.length - 1 - activeIndex.value,
          );
          shifted.value = shiftedAmount;
        })
        .onFinalize(() => {
          // Ensure we reset the gesture focus.
          scheduleOnRN(setEnabled, false);
          if (activeIndex.value !== INACTIVE) {
            if (onDragEnd) scheduleOnRN(onDragEnd);
            scheduleOnRN(
              onReordered,
              activeIndex.value,
              activeIndex.value + shifted.value,
            );
          }
          scheduleOnRN(onCleanup);
        }),
    [
      enabled,
      props.data.length,
      estimatedItemSize,
      activeIndex,
      pan,
      onDragEnd,
      onReordered,
      onCleanup,
      shifted,
    ],
  );

  const renderDragItem = useCallback(
    (info: ListRenderItemInfo<TData>) => (
      <TranslationWrapper
        estimatedItemSize={estimatedItemSize}
        index={info.index}
        activeIndex={activeIndex}
        pan={pan}
        shifted={shifted}
      >
        {renderItem({
          ...info,
          active: reactiveActiveIndex === info.index,
          isDragging: reactiveActiveIndex !== INACTIVE,
          onInitDrag: () => {
            if (onDragBegin) onDragBegin(info.item, info.index);
            setReactiveActiveIndex(info.index);
            scheduleOnUI(() => {
              activeIndex.value = info.index;
            });
          },
        })}
      </TranslationWrapper>
    ),
    [
      renderItem,
      onDragBegin,
      estimatedItemSize,
      activeIndex,
      reactiveActiveIndex,
      pan,
      shifted,
    ],
  );

  return (
    <GestureDetector gesture={gesture}>
      <FlatList {...ScrollablePresets} {...props} renderItem={renderDragItem} />
    </GestureDetector>
  );
}

function TranslationWrapper(props: {
  estimatedItemSize: number;
  index: number;
  activeIndex: SharedValue<number>;
  pan: SharedValue<number>;
  shifted: SharedValue<number>;
  children: React.ReactNode;
}) {
  const { estimatedItemSize, index, activeIndex, pan, shifted, children } =
    props;
  const itemPan = useSharedValue(0);

  useAnimatedReaction(
    () => pan.value,
    (currVal) => {
      if (activeIndex.value === INACTIVE) itemPan.value = 0;
      else if (index === activeIndex.value) itemPan.value = currVal;
      else {
        // Direction item will be moved.
        const dir = currVal < 0 ? 1 : -1;

        //? If we get a negative number, item is in path of current pan direction.
        const relToOGPos = dir * (index - activeIndex.value);
        //? If we get a non-negative number, item may have been moevd.
        const relToShiftedPos =
          dir * (index - (activeIndex.value + shifted.value));

        itemPan.value =
          relToOGPos < 0 && relToShiftedPos >= 0
            ? withSpring(dir * estimatedItemSize)
            : withSpring(0);
      }
    },
  );

  const styles = useAnimatedStyle(() => ({
    zIndex: index === activeIndex.value ? 100 : 0,
    transform: [{ translateY: itemPan.value }],
  }));

  return <Animated.View style={styles}>{children}</Animated.View>;
}
