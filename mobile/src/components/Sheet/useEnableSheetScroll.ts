import { useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Apply to a list inside a sheet to have the drag & scroll gestures co-exist.
 *
 * Ref: https://sheet.lodev09.com/troubleshooting#unable-to-drag-on-android
 */
export function useEnableSheetScroll() {
  const [minHeight, setMinHeight] = useState(0);
  return useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        if (minHeight === 0) setMinHeight(e.nativeEvent.layout.height + 1);
      },
      nestedScrollEnabled: true,
      contentContainerStyle: { minHeight },
    }),
    [minHeight],
  );
}
