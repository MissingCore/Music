import { useCallback, useMemo, useRef, useState } from "react";
import type {
  CellRendererProps,
  FlatListProps,
  LayoutChangeEvent,
  ListRenderItemInfo,
} from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import type { ActiveData } from "./DragListContext";
import { DragListProvider, useDragListContext } from "./DragListContext";
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
  | "data"
  | "style"
  | "className"
  | "contentContainerStyle"
  | "contentContainerClassName"
> {
  keyExtractor: (item: TData, index: number) => string;
  renderItem: (info: SheetDragListRenderItemInfo<TData>) => React.ReactElement;

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

export function SheetDragList<TData>({
  renderItem,
  itemSize,
  gap,
  onDragBegin,
  onDragEnd,
  onReordered,
  ...props
}: SheetDragListProps<TData>) {
  const keyExtractorRef = useRef(props.keyExtractor);
  keyExtractorRef.current = props.keyExtractor;

  const activeDataRef = useRef<ActiveData | null>(null);

  // Used to bail out of the current gesture if it wasn't initiated by dragging
  // the item. Useful when used in a Sheet where we want to also preserve the
  // normal sheet gestures.
  const [enabled, setEnabled] = useState(true);

  const dataLength = useSharedValue(props.data?.length ?? 0);
  const activeIndex = useSharedValue(INACTIVE);

  const pan = useSharedValue(0);
  const shifted = useSharedValue(0);

  const onReset = useCallback(() => {
    activeDataRef.current = null;
    activeIndex.value = INACTIVE;

    pan.value = 0;
    shifted.value = 0;
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
            Math.round(translationY / (itemSize + gap)),
            -activeIndex.value,
            dataLength.value - activeIndex.value,
          );
          shifted.value = shiftedAmount;
        })
        .onEnd(() => {
          if (activeIndex.value !== INACTIVE) {
            if (onDragEnd) scheduleOnRN(onDragEnd);

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
      pan,
      onDragEnd,
      onReordered,
      onReset,
      shifted,
    ],
  );

  const renderDragItem = useCallback(
    (info: ListRenderItemInfo<TData>) =>
      renderItem({
        ...info,
        active: activeDataRef.current?.index === info.index,
        isDragging: activeDataRef.current !== null,
        onInitDrag: () => {
          if (onDragBegin) onDragBegin(info.item, info.index);
          activeDataRef.current = {
            key: keyExtractorRef.current(info.item, info.index),
            index: info.index,
          };

          scheduleOnUI(() => {
            activeIndex.value = info.index;
          });
        },
      }),
    [renderItem, onDragBegin, activeIndex],
  );

  return (
    <GestureDetector gesture={gesture}>
      <DragListProvider
        keyExtractor={keyExtractorRef.current}
        activeData={activeDataRef.current}
        pan={pan}
      >
        <FlatList
          {...ScrollablePresets}
          {...props}
          keyExtractor={keyExtractorRef.current}
          renderItem={renderDragItem}
          extraData={[shifted]}
          CellRendererComponent={CellRendererComponent}
        />
      </DragListProvider>
    </GestureDetector>
  );
}

const DEFAULT_POS_STYLE = { transform: [{ translateY: 0 }] };

function CellRendererComponent<TData>(props: CellRendererProps<TData>) {
  const { onLayout, item, index, style, ...rest } = props;
  const { keyExtractor, activeData, pan, layoutCache, setLayoutCache } =
    useDragListContext<TData>();

  const key = keyExtractor(item, index);
  const isActive = key === activeData?.key;

  const activeItemLayout = activeData?.key
    ? layoutCache[activeData?.key]
    : undefined;
  const itemLayout = layoutCache[key];

  const styles = useAnimatedStyle(() => {
    if (!isActive) {
      if (!activeItemLayout || !itemLayout || pan.value === 0)
        return DEFAULT_POS_STYLE;

      // Direction item will be moved.
      const shiftDirectionMultiplier = pan.value < 0 ? 1 : -1;
      // Only move items in the given pan direction.
      const canMove =
        shiftDirectionMultiplier === 1
          ? itemLayout.y < activeItemLayout.y
          : itemLayout.y > activeItemLayout.y;
      if (!canMove) return DEFAULT_POS_STYLE;

      // Move item if at least half the dragged item is over the current item.
      const shouldMove =
        shiftDirectionMultiplier === 1
          ? activeItemLayout.y + pan.value <
            itemLayout.y + itemLayout.height - activeItemLayout.height / 2
          : activeItemLayout.y + activeItemLayout.height / 2 + pan.value >
            itemLayout.y;

      if (!shouldMove) return DEFAULT_POS_STYLE;
      return {
        transform: [
          { translateY: activeItemLayout.height * shiftDirectionMultiplier },
        ],
      };
    }
    return { transform: [{ translateY: pan.value }] };
  });

  const internalOnLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (onLayout) onLayout(e);
      const { height, y } = e.nativeEvent.layout;
      setLayoutCache((prev) => ({ ...prev, [key]: { height, y } }));
    },
    [key, onLayout, setLayoutCache],
  );

  return (
    <Animated.View
      {...rest}
      onLayout={internalOnLayout}
      style={[style, { zIndex: isActive ? 100 : undefined }, styles]}
    />
  );
}
