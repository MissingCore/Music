import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";

import { useSessionStore } from "~/services/SessionStore";

import { ArtworkPicker } from "./Artwork";

/** Renders in the top portion of the Now Playing screen, handling the current artwork and lyrics. */
export function ArtworkSlot(props: { artwork: string | null }) {
  const showLyrics = useSessionStore((s) => s.showLyrics);
  const { containerProps, size } = useArtworkSize();

  return (
    <View {...containerProps} className="flex-1">
      <View
        pointerEvents={showLyrics ? "none" : undefined}
        className="flex-1 items-center justify-center"
      >
        <ArtworkPicker source={props.artwork} size={size} />
      </View>
    </View>
  );
}

//#region Helpers
function useArtworkSize() {
  const [size, setSize] = useState(0);
  const containerRef = useRef<View>(null);

  /* Calculate the size of the artwork that maximizes the space. */
  useLayoutEffect(() => {
    containerRef.current?.measure((_x, _y, width, height) => {
      // Exclude the padding around the image depending on which measurement is used.
      setSize(Math.min(height, width) - 32);
    });
  }, []);

  const containerProps = useMemo(
    () => ({
      ref: containerRef,
      onLayout: (e: LayoutChangeEvent) => {
        const { height, width } = e.nativeEvent.layout;
        setSize(Math.min(height, width) - 32);
      },
    }),
    [],
  );

  return useMemo(() => ({ containerProps, size }), [containerProps, size]);
}
//#endregion
