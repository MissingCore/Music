import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent, View, ViewStyle } from "react-native";
import { useWindowDimensions } from "react-native";

type UseFloatingContentResult = {
  /** Padding-bottom need for scrollable content underneath the floating content. */
  offset: number;
  /** Props spread on the `View` wrapping the floating content. */
  floatingContentProps: {
    ref: React.RefObject<View | null>;
    onLayout: (e: LayoutChangeEvent) => void;
    style: ViewStyle;
    className: string;
  };
};

/** Get the bottom-offset needed for content behind floating content. */
export function useFloatingContent(): UseFloatingContentResult {
  const { width } = useWindowDimensions();
  const [offset, setOffset] = useState(16);
  const ref = useRef<View>(null);

  useLayoutEffect(() => {
    ref.current?.measure((_x, _y, _width, height) => {
      // Add 16px top & bottom padding around button.
      setOffset(height + 32);
    });
  }, []);

  return useMemo(
    () => ({
      offset,
      floatingContentProps: {
        ref,
        onLayout: (e: LayoutChangeEvent) =>
          setOffset(e.nativeEvent.layout.height + 32),
        style: { maxWidth: width - 32 },
        className: "absolute bottom-4 left-4 w-full rounded-md bg-surface",
      },
    }),
    [offset, width],
  );
}
