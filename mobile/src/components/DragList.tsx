import { createContext, use, useCallback, useMemo, useRef } from "react";
import {
  GestureDetector,
  useNativeGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  scrollTo,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import { cn } from "~/lib/style";
import type { LegendListProps, ListRenderItemInfo } from "./Base/LegendList";
import { LegendList, useAnimatedLegendListRef } from "./Base/LegendList";

export type DragListRenderItemInfo<TData> = {
  item: TData;
  index: number;
};

interface DragListProps<TData> extends Omit<
  LegendListProps<TData>,
  "data" | "keyExtractor" | "renderItem" | "estimatedItemSize"
> {
  data: TData[];
  keyExtractor: (item: TData, index: number) => string;
  renderItem: (info: DragListRenderItemInfo<TData>) => React.ReactElement;
  /** All items should be the same size. Include gap. */
  estimatedItemSize: number;

  /** Called when item captured drag gesture. */
  onDragBegin?: VoidFunction;
  /** Called after the dragged item is dropped. */
  onDragEnd?: VoidFunction;
  /** Called when an item is successfully moved. */
  onReordered: (fromIndex: number, toIndex: number) => void;

  /** If default stylings to fix "fake gaps" will be applied. Defaults to `true`. */
  useDefaultStyles?: boolean;
}

const INACTIVE = -1;

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
  renderItem,
  estimatedItemSize,
  useDefaultStyles = true,
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

  const listRef = useAnimatedLegendListRef();
  const listHeight = useSharedValue(-1);
  const scrollPosition = useSharedValue(0);
  const autoScrollDirection = useSharedValue(0);
  const autoScrollAmount = useSharedValue(0);

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
    });
    enabled.set(true);
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
        scheduleOnRN(
          onReordered,
          activeIndex.get(),
          activeIndex.get() + shifted.get(),
        );
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
      // @ts-expect-error - Ref is compatible.
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

  const renderDragItem = useCallback(
    (info: ListRenderItemInfo<TData>) => (
      <TranslationWrapper index={info.index}>
        {renderItem({ item: info.item, index: info.index })}
      </TranslationWrapper>
    ),
    [renderItem],
  );

  // Reset transitions during render after the data changes to prevent flashing.
  if (dataRef.current !== data) {
    dataRef.current = data;
    onCleanup();
  }

  return (
    <GestureDetector gesture={gestures}>
      <LegendList
        {...props}
        ref={listRef}
        onLayout={(e) => listHeight.set(e.nativeEvent.layout.height)}
        estimatedItemSize={estimatedItemSize}
        data={dataRef.current}
        renderItem={renderDragItem}
        // Prevent dragged item from disappearing when moved outside of `windowSize`.
        alwaysRender={{
          indices:
            reactiveActiveIndex !== INACTIVE ? [reactiveActiveIndex] : [],
        }}
        onScroll={scrollHandler}
        scrollEnabled={reactiveActiveIndex === INACTIVE}
        // Fixes some issues caused by recycling.
        extraData={reactiveActiveIndex}
        className={cn({ "-mb-2": useDefaultStyles }, props.className)}
        contentContainerClassName={cn(
          { "py-4": useDefaultStyles },
          props.contentContainerClassName,
        )}
      />
    </GestureDetector>
  );
}

function TranslationWrapper(props: {
  index: number;
  children: React.ReactNode;
}) {
  const estimatedItemSize = useDragListStore((s) => s.estimatedItemSize);
  const activeIndex = useDragListStore((s) => s.activeIndex);
  const pan = useDragListStore((s) => s.pan);
  const shifted = useDragListStore((s) => s.shifted);
  const itemPan = useSharedValue(0);

  useAnimatedReaction(
    () => pan.get(),
    (currVal) => {
      if (activeIndex.get() === INACTIVE) itemPan.set(0);
      else if (props.index === activeIndex.get()) itemPan.set(currVal);
      else {
        // Direction item will be moved.
        const dir = currVal < 0 ? 1 : -1;

        //? If we get a negative number, item is in path of current pan direction.
        const relToOGPos = dir * (props.index - activeIndex.get());
        //? If we get a non-negative number, item may have been moved.
        const relToShiftedPos =
          dir * (props.index - (activeIndex.get() + shifted.get()));

        itemPan.set(
          relToOGPos < 0 && relToShiftedPos >= 0
            ? withSpring(dir * estimatedItemSize)
            : withSpring(0),
        );
      }
    },
  );

  const styles = useAnimatedStyle(() => ({
    zIndex: props.index === activeIndex.get() ? 100 : 0,
    transform: [{ translateY: itemPan.get() }],
  }));

  return <Animated.View style={styles}>{props.children}</Animated.View>;
}

//#region Context
type DragListStore = {
  estimatedItemSize: number;
  activeIndex: SharedValue<number>;
  /** How much the dragged item was moved (includes auto-scroll & manual pan amounts). */
  pan: SharedValue<number>;
  /** How many spots we moved the item. */
  shifted: SharedValue<number>;

  reactiveActiveIndex: number;
  setReactiveActiveIndex: (id: number) => void;

  onInitDrag: (index: number) => void;
};

const DragListStoreContext = createContext<StoreApi<DragListStore>>(
  null as never,
);

function DragListStoreProvider(props: {
  estimatedItemSize: number;
  onDragBegin?: VoidFunction;
  children: React.ReactNode;
}) {
  const activeIndex = useSharedValue(INACTIVE);
  const pan = useSharedValue(0);
  const shifted = useSharedValue(0);
  const storeRef = useRef<StoreApi<DragListStore>>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<DragListStore>()((set) => ({
      estimatedItemSize: props.estimatedItemSize,
      activeIndex,
      pan,
      shifted,

      reactiveActiveIndex: INACTIVE,
      setReactiveActiveIndex: (idx) => set({ reactiveActiveIndex: idx }),

      onInitDrag: (index) => {
        if (props.onDragBegin) props.onDragBegin();
        set({ reactiveActiveIndex: index });
        scheduleOnUI(() => activeIndex.set(index));
      },
    }));
  }

  return (
    <DragListStoreContext value={storeRef.current}>
      {props.children}
    </DragListStoreContext>
  );
}

export function useDragListStore<T>(selector: (state: DragListStore) => T) {
  const store = use(DragListStoreContext);
  if (!store) {
    throw new Error(
      "useDragListStore must be called within a DragListStoreProvider.",
    );
  }
  return useStore(store, selector);
}

export function useDragListState(index: number) {
  const _onInitDrag = useDragListStore((s) => s.onInitDrag);
  const isDragging = useDragListStore(
    (s) => s.reactiveActiveIndex !== INACTIVE,
  );
  const isActive = useDragListStore((s) => s.reactiveActiveIndex === index);

  const onInitDrag = useCallback(
    () => _onInitDrag(index),
    [_onInitDrag, index],
  );

  return useMemo(
    () => ({ isActive, isDragging, onInitDrag }),
    [isActive, isDragging, onInitDrag],
  );
}
//#endregion
