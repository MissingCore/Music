import { createContext, use, useRef } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

interface DragListStore {
  /** Size of the rendered items. All items should be the same size, with any gap included. */
  estimatedItemSize: number;

  activeIndex: SharedValue<number>;
  /** How much the dragged item was moved (includes auto-scroll & manual pan amounts). */
  pan: SharedValue<number>;
  /** How many spots we moved the item. */
  shifted: SharedValue<number>;

  reactiveActiveIndex: number;
  setReactiveActiveIndex: (id: number) => void;

  onInitDrag: (index: number) => void;
}

export const INACTIVE = -1;

const DragListStoreContext = createContext<StoreApi<DragListStore>>(
  null as never,
);

export function DragListStoreProvider(props: {
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
