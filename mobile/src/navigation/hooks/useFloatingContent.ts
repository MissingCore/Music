import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { useWindowDimensions } from "react-native";

type UseFloatingContentResult = {
  /** Get and stores the height of the floating content. */
  onLayout: (e: LayoutChangeEvent) => void;
  /** Padding-bottom need for scrollable content underneath the floating content. */
  offset: number;
  /** Absolute-posiiton styles to apply to the wrapping container. */
  wrapperStyling: { style: ViewStyle; className: string };
};

/** Get the bottom-offset needed for content behind floating content. */
export function useFloatingContent(): UseFloatingContentResult {
  const { width } = useWindowDimensions();
  const [offset, setOffset] = useState(16);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    // Add 16px top & bottom padding around button.
    setOffset(e.nativeEvent.layout.height + 32);
  }, []);

  const wrapperStyling = useMemo(
    () => ({
      className: "absolute bottom-4 left-4 w-full rounded-md bg-canvas",
      style: { maxWidth: width - 32 },
    }),
    [width],
  );

  return useMemo(
    () => ({ onLayout, offset, wrapperStyling }),
    [onLayout, offset, wrapperStyling],
  );
}
