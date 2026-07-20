// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";

import { useLyricStore } from "~/modules/lyric/core/store";

import { LyricsOverlay } from "~/modules/lyric/components/LyricsOverlay";
import { ArtworkPicker } from "./Artwork";

/** Renders in the top portion of the Now Playing screen, handling the current artwork and lyrics. */
export function ArtworkSlot(props: {
  artwork: string | null;
  trackId: string;
}) {
  const showLyrics = useLyricStore((s) => s.visible);
  const { containerProps, size, dimensions } = useArtworkSize();

  return (
    <View {...containerProps} className="flex-1">
      <View
        pointerEvents={showLyrics ? "none" : undefined}
        className="flex-1 items-center justify-center"
      >
        <ArtworkPicker
          source={props.artwork}
          size={size}
          dimensions={dimensions}
        />
      </View>
      {showLyrics ? (
        <LyricsOverlay size={size} trackId={props.trackId} />
      ) : null}
    </View>
  );
}

//#region Helpers
function useArtworkSize() {
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [size, setSize] = useState(0);
  const containerRef = useRef<View>(null);

  /* Calculate the size of the artwork that maximizes the space. */
  useLayoutEffect(() => {
    containerRef.current?.measure((_x, _y, width, height) => {
      // Exclude the padding around the image depending on which measurement is used.
      setSize(Math.min(height, width) - 32);
      setDimensions({ height, width });
    });
  }, []);

  const containerProps = useMemo(
    () => ({
      ref: containerRef,
      onLayout: (e: LayoutChangeEvent) => {
        const { height, width } = e.nativeEvent.layout;
        setSize(Math.min(height, width) - 32);
        setDimensions({ height, width });
      },
    }),
    [],
  );

  return useMemo(
    () => ({ containerProps, size, dimensions }),
    [containerProps, size, dimensions],
  );
}
//#endregion
