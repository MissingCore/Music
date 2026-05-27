import { useCallback, useMemo, useRef, useState } from "react";
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

export type SheetDragListRenderItemInfo<TData> = {
  item: TData;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  onInitDrag: VoidFunction;
};

interface SheetDragListProps<TData> extends Pick<
  FlatListProps<TData>,
  "style" | "className" | "contentContainerStyle" | "contentContainerClassName"
> {
  data: TData[];
  keyExtractor: (item: TData, index: number) => string;
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

/**
 * Drag list that can be used inside a sheet.
 * - **Should only be used for short lists.**
 * - **Does not have auto-scrolling support.**
 */
export function SheetDragList<TData>({
  data,
  renderItem,
  estimatedItemSize,
  onDragBegin,
  onDragEnd,
  onReordered,
  ...props
}: SheetDragListProps<TData>) {
  const [enabled, setEnabled] = useState(true);

  const dataRef = useRef(data);
  const activeIndex = useSharedValue(INACTIVE);
  const [reactiveActiveIndex, setReactiveActiveIndex] = useState(INACTIVE);

  const pan = useSharedValue(0);
  const shifted = useSharedValue(0);

  const onCleanup = useCallback(() => {
    setReactiveActiveIndex(INACTIVE);
    scheduleOnUI(() => {
      activeIndex.set(INACTIVE);
      pan.set(0);
      shifted.set(0);
    });
    setEnabled(true);
  }, [activeIndex, pan, shifted]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          // Bail out of gesture early.
          if (activeIndex.get() === INACTIVE) scheduleOnRN(setEnabled, false);
        })
        .onUpdate(({ translationY }) => {
          if (activeIndex.get() === INACTIVE) return;
          pan.set(translationY);

          const shiftedAmount = clamp(
            Math.round(translationY / estimatedItemSize),
            -activeIndex.get(),
            data.length - 1 - activeIndex.get(),
          );
          shifted.set(shiftedAmount);
        })
        .onFinalize(() => {
          // Ensure we reset the gesture focus.
          scheduleOnRN(setEnabled, false);
          if (activeIndex.get() !== INACTIVE) {
            if (onDragEnd) scheduleOnRN(onDragEnd);
            scheduleOnRN(
              onReordered,
              activeIndex.get(),
              activeIndex.get() + shifted.get(),
            );
          }
          scheduleOnRN(onCleanup);
        }),
    [
      enabled,
      data.length,
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
          isActive: reactiveActiveIndex === info.index,
          isDragging: reactiveActiveIndex !== INACTIVE,
          onInitDrag: () => {
            if (onDragBegin) onDragBegin(info.item, info.index);
            setReactiveActiveIndex(info.index);
            scheduleOnUI(() => activeIndex.set(info.index));
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

  // Reset transitions during render after the data changes to prevent flashing.
  if (dataRef.current !== data) {
    dataRef.current = data;
    onCleanup();
  }

  return (
    <GestureDetector gesture={gesture}>
      <FlatList
        // Have a key based on the data to prevent flashing.
        key={JSON.stringify(dataRef.current)}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        {...props}
        data={dataRef.current}
        renderItem={renderDragItem}
      />
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
    () => pan.get(),
    (currVal) => {
      if (activeIndex.get() === INACTIVE) itemPan.set(0);
      else if (index === activeIndex.get()) itemPan.set(currVal);
      else {
        // Direction item will be moved.
        const dir = currVal < 0 ? 1 : -1;

        //? If we get a negative number, item is in path of current pan direction.
        const relToOGPos = dir * (index - activeIndex.get());
        //? If we get a non-negative number, item may have been moevd.
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
}
