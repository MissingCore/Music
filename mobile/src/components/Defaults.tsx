import { useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent, ScrollViewProps } from "react-native";
import type { FlashDragListProps } from "react-native-draglist/dist/FlashList";
import RawFlashDragList from "react-native-draglist/dist/FlashList";
import { withUniwind } from "uniwind";

/** Presets for scrollview-like components. */
export const ScrollablePresets = {
  overScrollMode: "never",
  showsHorizontalScrollIndicator: false,
  showsVerticalScrollIndicator: false,
} satisfies ScrollViewProps;

/**
 * Returns whether a scrollable container is scrollable (ie: if its content
 * height is greater than the container size).
 */
export function useIsScrollable() {
  const layoutHeight = useRef(0);
  const lastContentSizeChangeHeight = useRef(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const handlers = useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        layoutHeight.current = e.nativeEvent.layout.height;
        //? Encountered a situation where `onLayout` fired again, but
        //? `onContentSizeChange` didn't.
        setIsScrollable(
          lastContentSizeChangeHeight.current > e.nativeEvent.layout.height,
        );
      },
      onContentSizeChange: (_w: number, h: number) => {
        lastContentSizeChangeHeight.current = h;
        setIsScrollable(h > layoutHeight.current && layoutHeight.current !== 0);
      },
    }),
    [],
  );

  return useMemo(() => ({ handlers, isScrollable }), [handlers, isScrollable]);
}

//#region Flash Drag List
const WrappedFlashDragList = withUniwind(
  RawFlashDragList,
) as typeof RawFlashDragList;

export function FlashDragList<T>(props: FlashDragListProps<T>) {
  return <WrappedFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion
