import type {
  LegendListProps,
  LegendListRenderItemProps,
} from "@legendapp/list/react-native";
import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GestureDetector,
  useNativeGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import {
  clamp,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { withUniwind } from "uniwind";

import { ItemWrapper } from "./ItemWrapper";
import {
  DragListStoreProvider,
  INACTIVE,
  useDragListStore,
} from "../core/store";
import type { DragListRenderItemInfo } from "../core/types";

const WrappedAnimatedLegendList = withUniwind(AnimatedLegendList) as <T>(
  props: LegendListProps<T>,
) => React.JSX.Element;

interface DragListProps<TData> extends Pick<
  AnimatedLegendListProps<TData>,
  | "initialScrollIndex"
  | "pointerEvents"
  | "ListHeaderComponent"
  | "ListEmptyComponent"
  | "className"
  | "contentContainerClassName"
  | "style"
  | "contentContainerStyle"
> {
  data: TData[];
  keyExtractor: (item: TData, index: number) => string;
  renderItem: (info: DragListRenderItemInfo<TData>) => React.ReactElement;
  /** Size of the rendered items. All items should be the same size, with any gap included. */
  estimatedItemSize: number;
  /** Guaranteed fix to lingering outdated styles at the cost of poor scroll performance. */
  alwaysKeyRenderedItems?: boolean;

  /** Called when item captured drag gesture. */
  onDragBegin?: VoidFunction;
  /** Called after the dragged item is dropped. */
  onDragEnd?: VoidFunction;
  /** Called when an item is successfully moved. */
  onReordered: (fromIndex: number, toIndex: number) => void;
}

export function DragList<TData>(props: DragListProps<TData>) {
  return (
    <DragListStoreProvider
      estimatedItemSize={props.estimatedItemSize}
      onDragBegin={props.onDragBegin}
    >
      <DragListImpl {...props} />
    </DragListStoreProvider>
  );
}

function DragListImpl<TData>({
  data,
  keyExtractor: _keyExtractor,
  renderItem,
  estimatedItemSize,
  alwaysKeyRenderedItems = false,
  onDragBegin: _,
  onDragEnd,
  onReordered,
  ...props
}: DragListProps<TData>) {
  const enabled = useSharedValue(true);

  const dataRef = useRef(data);
  const pan = useDragListStore((s) => s.pan);
  const shifted = useDragListStore((s) => s.shifted);
  const activeIndex = useDragListStore((s) => s.activeIndex);
  const reactiveActiveIndex = useDragListStore((s) => s.reactiveActiveIndex);
  const setReactiveActiveIndex = useDragListStore(
    (s) => s.setReactiveActiveIndex,
  );

  const listRef = useAnimatedRef();
  const listHeight = useSharedValue(-1);
  const scrollPosition = useSharedValue(0);
  const autoScrollDirection = useSharedValue(0);
  const autoScrollAmount = useSharedValue(0);

  const [isInReRenderRange, _setIsInReRenderRange] =
    useState<(index: number) => boolean>();
  const setIsInReRenderRange = useCallback((start: number, end: number) => {
    if (start === end) return _setIsInReRenderRange(undefined);
    _setIsInReRenderRange(
      () => (index: number) =>
        start > end
          ? index >= end && index <= start
          : index <= end && index >= start,
    );
  }, []);

  //? Resets `isInReRenderRange` the render after force-re-rendering the moved
  //? items to purge outdated styles.
  useEffect(() => {
    if (reactiveActiveIndex === INACTIVE) _setIsInReRenderRange(undefined);
  }, [reactiveActiveIndex]);

  const revalidatedShifted = useCallback(() => {
    "worklet";
    shifted.set(
      clamp(
        Math.round(pan.get() / estimatedItemSize),
        -activeIndex.get(),
        data.length - 1 - activeIndex.get(),
      ),
    );
  }, [activeIndex, pan, shifted, estimatedItemSize, data]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      "worklet";
      const delta = e.contentOffset.y - scrollPosition.get();
      scrollPosition.set(e.contentOffset.y);

      if (activeIndex.get() !== INACTIVE) {
        const newPan = pan.get() + delta;
        autoScrollAmount.set((prev) => prev + delta);
        pan.set(newPan);
        revalidatedShifted();
      }
    },
  });

  const onCleanup = useCallback(() => {
    setReactiveActiveIndex(INACTIVE);
    scheduleOnUI(() => {
      activeIndex.set(INACTIVE);
      autoScrollDirection.set(0);
      autoScrollAmount.set(0);
      pan.set(0);
      shifted.set(0);
      enabled.set(true);
    });
  }, [
    enabled,
    setReactiveActiveIndex,
    autoScrollDirection,
    autoScrollAmount,
    activeIndex,
    pan,
    shifted,
  ]);

  const panListenerGesture = usePanGesture({
    enabled,
    onActivate: () => {
      // Bail out of gesture early.
      if (activeIndex.get() === INACTIVE) enabled.set(false);
    },
    onUpdate: ({ translationY, y }) => {
      //? Stop auto-scroll when we move (clears the timer which continues the auto-scroll).
      autoScrollDirection.set(0);
      if (activeIndex.get() === INACTIVE) return;
      pan.set(autoScrollAmount.get() + translationY);
      revalidatedShifted();

      //? Auto-scroll handling.
      let direction = 0;
      if (y < estimatedItemSize) direction = -1;
      else if (y > listHeight.get() - estimatedItemSize) direction = 1;
      autoScrollDirection.set(direction);
    },
    onFinalize: () => {
      // Ensure we reset the gesture focus.
      enabled.set(false);
      if (activeIndex.get() !== INACTIVE) {
        if (onDragEnd) scheduleOnRN(onDragEnd);
        const startIndex = activeIndex.get();
        const endIndex = activeIndex.get() + shifted.get();
        scheduleOnRN(setIsInReRenderRange, startIndex, endIndex);
        scheduleOnRN(onReordered, startIndex, endIndex);
      }
      scheduleOnRN(onCleanup);
    },
  });

  useAnimatedReaction(
    () => autoScrollDirection.get(),
    (direction) => {
      if (direction === 0) return;
      const changeDelta = estimatedItemSize * direction;
      const newScrollOffset = scrollPosition.get() + changeDelta;
      scrollTo(listRef, 0, newScrollOffset, true);

      //? Reset to `0` to prevent excessive re-fires.
      autoScrollDirection.set(0);
      autoScrollDirection.set(
        withDelay(
          250,
          withTiming(0, { duration: 0 }, (finished) => {
            if (finished)
              autoScrollDirection.set(clamp(direction * 1.25, -2.5, 2.5));
          }),
        ),
      );
    },
  );

  // The "Native" gesture allows for scroll to work.
  const nativeGesture = useNativeGesture({});
  const gestures = useSimultaneousGestures(nativeGesture, panListenerGesture);

  //? Need to include the `index` in the key as if an item is removed, it
  //? might not get re-rendered, resulting it in using the original `index`
  //? value that it was rendered with. This becomes an issue where our
  //? rendered items use `index` for `useDragListState()`.
  const keyExtractor = useCallback(
    (item: TData, index: number) => `${index}__${_keyExtractor(item, index)}`,
    [_keyExtractor],
  );

  const renderDragItem = useCallback(
    ({ item, index, extraData }: LegendListRenderItemProps<TData>) => (
      <ItemWrapper
        //? Define a key to prevent weird flashing issues potentially caused by
        //? outdated translations styles being applied by forcing a re-render only
        //? on the items that moved. This has a side-effect of making scrolling worse.
        key={
          alwaysKeyRenderedItems || extraData?.(index)
            ? `${keyExtractor(item, index)}_${index}`
            : undefined
        }
        index={index}
      >
        {renderItem({ item, index })}
      </ItemWrapper>
    ),
    [alwaysKeyRenderedItems, keyExtractor, renderItem],
  );

  // Reset transitions during render after the data changes to prevent flashing.
  if (dataRef.current !== data) {
    dataRef.current = data;
    onCleanup();
  }

  return (
    <GestureDetector gesture={gestures}>
      <WrappedAnimatedLegendList
        {...props}
        // @ts-expect-error - Ref is compatible.
        ref={listRef}
        onLayout={(e) => listHeight.set(e.nativeEvent.layout.height)}
        estimatedItemSize={estimatedItemSize}
        data={dataRef.current}
        keyExtractor={keyExtractor}
        renderItem={renderDragItem}
        // Prevent dragged item from disappearing when moved outside of `windowSize`.
        alwaysRender={{
          indices:
            reactiveActiveIndex !== INACTIVE ? [reactiveActiveIndex] : [],
        }}
        onScroll={scrollHandler}
        scrollEnabled={reactiveActiveIndex === INACTIVE}
        recycleItems
        // Fixes some issues caused by recycling.
        extraData={isInReRenderRange}
        maintainVisibleContentPosition={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </GestureDetector>
  );
}
