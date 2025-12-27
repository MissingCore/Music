import { useCallback, useMemo, useState } from "react";
import type { FlatListProps, ListRenderItemInfo } from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, { clamp, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { ScrollablePresets } from "./Defaults";

export type RNGHListRenderItemInfo<TData> = {
  item: TData;
  index: number;
  active: boolean;
  isDragging: boolean;
  onInitDrag: VoidFunction;
};

interface RNGHDragListProps<TData> extends Pick<
  FlatListProps<TData>,
  | "data"
  | "keyExtractor"
  | "style"
  | "className"
  | "contentContainerStyle"
  | "contentContainerClassName"
> {
  renderItem: (info: RNGHListRenderItemInfo<TData>) => React.ReactElement;

  itemSize: number;
  gap: number;

  /** Called when item captured drag gesture. */
  onDragBegin?: (item: TData, index: number) => void;
  /** Called after the dragged item is dropped. */
  onDragEnd?: VoidFunction;
  /** Called when an item is successfully moved. */
  onReordered: (fromIndex: number, toIndex: number) => void;
}

const INACTIVE = -1;

export function RNGHDragList<TData>({
  renderItem,
  itemSize,
  gap,
  onDragBegin,
  onDragEnd,
  onReordered,
  ...props
}: RNGHDragListProps<TData>) {
  const [enabled, setEnabled] = useState(true);

  const dataLength = useSharedValue(props.data?.length ?? 0);
  const activeIndex = useSharedValue(INACTIVE);
  const [reactiveActiveIndex, setReactiveActiveIndex] = useState(INACTIVE);

  const delta = useSharedValue(0);
  const shifted = useSharedValue(0);
  const [reactiveShifted, setReactiveShifted] = useState(0);

  const onReset = useCallback(() => {
    setReactiveActiveIndex(INACTIVE);
    activeIndex.value = INACTIVE;

    delta.value = 0;
    setReactiveShifted(0);
    shifted.value = 0;
  }, [activeIndex, delta, shifted]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          // Early bail out.
          if (activeIndex.value === INACTIVE) scheduleOnRN(setEnabled, false);
        })
        .onUpdate(({ translationY }) => {
          if (activeIndex.value === INACTIVE) return;
          delta.value = translationY;

          const shiftedAmount = clamp(
            Math.round(translationY / (itemSize + gap)),
            -activeIndex.value,
            dataLength.value - activeIndex.value,
          );
          scheduleOnRN(setReactiveShifted, shiftedAmount);
          shifted.value = shiftedAmount;
        })
        .onEnd(() => {
          if (activeIndex.value !== INACTIVE) {
            if (onDragEnd) scheduleOnRN(onDragEnd);
          }

          if (shifted.value !== 0) {
            scheduleOnRN(
              onReordered,
              activeIndex.value,
              activeIndex.value + shifted.value,
            );
          }
          scheduleOnRN(onReset);
          scheduleOnRN(setEnabled, true);
        }),
    [
      enabled,
      itemSize,
      gap,
      dataLength,
      activeIndex,
      delta,
      onDragEnd,
      onReordered,
      onReset,
      shifted,
    ],
  );

  const renderDragItem = useCallback(
    (info: ListRenderItemInfo<TData>) => {
      const isActive = reactiveActiveIndex === info.index;
      const isShifted =
        info.index >
          Math.min(
            reactiveActiveIndex,
            reactiveActiveIndex + reactiveShifted,
          ) &&
        info.index <
          Math.max(reactiveActiveIndex, reactiveActiveIndex + reactiveShifted);

      const direction = reactiveShifted < 0 ? 1 : -1;

      return (
        <Animated.View
          //? `key` required to fix weird layout issue with active item after we drop it.
          key={`${info.index}_${isActive}`}
          style={
            isActive
              ? { zIndex: 100, transform: [{ translateY: delta }] }
              : isShifted
                ? { transform: [{ translateY: (itemSize + gap) * direction }] }
                : undefined
          }
        >
          {renderItem({
            ...info,
            active: isActive,
            isDragging: reactiveActiveIndex !== INACTIVE,
            onInitDrag: () => {
              if (onDragBegin) onDragBegin(info.item, info.index);
              setReactiveActiveIndex(info.index);
              scheduleOnUI(() => {
                activeIndex.value = info.index;
              });
            },
          })}
        </Animated.View>
      );
    },
    [
      renderItem,
      onDragBegin,
      activeIndex,
      reactiveActiveIndex,
      reactiveShifted,
    ],
  );

  return (
    <GestureDetector gesture={gesture}>
      <FlatList
        {...ScrollablePresets}
        {...props}
        renderItem={renderDragItem}
        extraData={[activeIndex, shifted]}
      />
    </GestureDetector>
  );
}
