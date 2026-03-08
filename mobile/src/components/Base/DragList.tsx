import { createContext, memo, use, useCallback, useMemo, useRef } from "react";
import type {
  ReorderableListProps,
  ReorderableListDragStartEvent,
  ReorderableListCellAnimations,
} from "react-native-reorderable-list";
import ReorerableList, {
  useReorderableDrag,
} from "react-native-reorderable-list";
import { scheduleOnRN } from "react-native-worklets";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import { cn } from "~/lib/style";
import { getListItemLayout } from "./List";

type DragListSignature = <T>(
  props: Omit<
    ReorderableListProps<T>,
    "className" | "getItemLayout" | "onDragStart" | "onDragEnd"
  >,
) => React.JSX.Element;

/**
 * Pre-styled drag list. Should be used with our standard list items
 * (48px Height with 8px Margin Bottom).
 */
export const DragList = memo(function DragList(props) {
  return (
    <DragListStoreProvider>
      <DragListInternal {...props} />
    </DragListStoreProvider>
  );
}) as DragListSignature;

const DragListInternal = memo(function DragListInternal({
  initialScrollIndex,
  ...props
}) {
  const setActiveIndex = useDragListStore((s) => s.setActiveIndex);

  const onDragStart = useCallback(
    (e: ReorderableListDragStartEvent) => {
      "worklet";
      scheduleOnRN(setActiveIndex, e.index);
    },
    [setActiveIndex],
  );
  const onDragEnd = useCallback(() => {
    "worklet";
    scheduleOnRN(setActiveIndex, null);
  }, [setActiveIndex]);

  return (
    <ReorerableList
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      windowSize={3} // We don't need that many screens rendered on mount.
      cellAnimations={cellAnimations}
      initialScrollIndex={initialScrollIndex}
      {...props}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      getItemLayout={getListItemLayout}
      className="-mb-2"
      contentContainerClassName={cn("py-4", props.contentContainerClassName)}
    />
  );
}) as DragListSignature;

const cellAnimations: ReorderableListCellAnimations = { opacity: 1 };

//#region DragList Store
type DragListStore = {
  activeIndex: number | null;
  setActiveIndex: (id: number | null) => void;
};

const DragListStoreContext = createContext<StoreApi<DragListStore>>(
  null as never,
);

function DragListStoreProvider(props: { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<DragListStore>>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<DragListStore>()((set) => ({
      activeIndex: null,
      setActiveIndex: (id) => set({ activeIndex: id }),
    }));
  }

  return <DragListStoreContext value={storeRef.current} {...props} />;
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
  const isDragging = useDragListStore((s) => s.activeIndex !== null);
  const isActive = useDragListStore((s) => s.activeIndex === index);

  return useMemo(() => ({ isActive, isDragging }), [isActive, isDragging]);
}
//#endregion

export const useInitDrag = useReorderableDrag;
