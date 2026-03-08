import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
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

import { PagePlaceholder } from "~/navigation/components/Placeholder";

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

type MountedState = "unmounted" | "pending" | "mounted";

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

  //#region `initialScrollIndex` Hacks
  const [mountedState, setMountedState] = useState<MountedState>("unmounted");
  const containerHeightRef = useRef(0);
  const [shouldUseInitialScrollIndex, setShouldUseInitialScrollIndex] =
    useState(typeof initialScrollIndex === "number");

  const setContainerHeight = useCallback((e: LayoutChangeEvent) => {
    containerHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  //? If the list isn't scrollable, items that aren't at `initialScrollIndex`
  //? won't get rendered.
  const updateShouldUseInitialScrollIndex = useCallback(
    (_: number, contentHeight: number) => {
      if (mountedState === "mounted") return;
      setShouldUseInitialScrollIndex(
        contentHeight > containerHeightRef.current,
      );
    },
    [mountedState],
  );

  //? Delay render of list due to having an `initialScrollIndex` making
  //? items not at that index render later.
  useEffect(() => {
    if (mountedState !== "unmounted") return;
    const canMount = typeof initialScrollIndex !== "number";
    setMountedState(canMount ? "mounted" : "pending");
    if (canMount) return;
    setTimeout(() => {
      setMountedState("mounted");
    }, 250);
  }, [initialScrollIndex, mountedState]);
  //#endregion

  return (
    <View onLayout={setContainerHeight} className="relative flex-1">
      <ReorerableList
        key={String(shouldUseInitialScrollIndex)}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        windowSize={3} // We don't need that many screens rendered on mount.
        cellAnimations={cellAnimations}
        initialScrollIndex={
          shouldUseInitialScrollIndex ? initialScrollIndex : undefined
        }
        {...props}
        onContentSizeChange={updateShouldUseInitialScrollIndex}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        getItemLayout={getListItemLayout}
        className="-mb-2"
        contentContainerClassName={cn("py-4", props.contentContainerClassName)}
      />
      {mountedState !== "mounted" ? (
        <PagePlaceholder
          isPending
          wrapperClassName="absolute inset-0 bg-surface"
        />
      ) : null}
    </View>
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
