import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { View, ViewStyle } from "react-native";
import { useWindowDimensions } from "react-native";

type UseFloatingContentResult = {
  /** Container used to calculate height of floating content. */
  floatingRef: React.RefObject<View | null>;
  /** Padding-bottom need for scrollable content underneath the floating content. */
  offset: number;
  /** Absolute-posiiton styles to apply to the wrapping container. */
  wrapperStyling: { style: ViewStyle; className: string };
};

/** Get the bottom-offset needed for content behind floating content. */
export function useFloatingContent(): UseFloatingContentResult {
  const { width } = useWindowDimensions();
  const [offset, setOffset] = useState(16);
  const floatingRef = useRef<View>(null);

  useLayoutEffect(() => {
    floatingRef.current?.measure((_x, _y, _width, height) => {
      // Add 16px top & bottom padding around button.
      setOffset(height + 32);
    });
  }, []);

  const wrapperStyling = useMemo(
    () => ({
      className: "absolute bottom-4 left-4 w-full rounded-md bg-surface",
      style: { maxWidth: width - 32 },
    }),
    [width],
  );

  return useMemo(
    () => ({ floatingRef, offset, wrapperStyling }),
    [offset, wrapperStyling],
  );
}
