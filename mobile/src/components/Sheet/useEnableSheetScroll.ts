import { useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Apply to a list inside a sheet to have the drag & scroll gestures co-exist.
 *
 * Ref: https://sheet.lodev09.com/troubleshooting#unable-to-drag-on-android
 */
export function useEnableSheetScroll(scrollView?: boolean) {
  const minHeightRef = useRef(0);
  const [minHeight, setMinHeight] = useState(0);
  const [nestedScrollEnabled, setNestedScrollEnabled] = useState(!scrollView);

  return useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        if (minHeight === 0) {
          minHeightRef.current = e.nativeEvent.layout.height;
          setMinHeight(e.nativeEvent.layout.height + (scrollView ? 0 : 1));
        }
      },
      onContentSizeChange: (_: number, contentHeight: number) => {
        // Need a `ref` for instant acces to `minHeight` value.
        if (contentHeight !== minHeightRef.current)
          setNestedScrollEnabled(true);
      },
      nestedScrollEnabled: nestedScrollEnabled,
      contentContainerStyle: { minHeight },
    }),
    [scrollView, minHeight, nestedScrollEnabled],
  );
}
