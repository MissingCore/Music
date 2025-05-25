import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { useProgress } from "react-native-track-player";

import { MusicControls } from "~/modules/media/services/Playback";

/** Dragging slider position. */
const NextSliderPositionAtom = atom<number | null>(null);

/** Safely manages the visible seekbar position to prevent "rubberbanding". */
export function usePlayerProgress() {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [updateInterval, setUpdateInterval] = useState(200);
  const { position } = useProgress(updateInterval);
  const nextSliderPosition = useAtomValue(NextSliderPositionAtom);
  const setNextSliderPosition = useSetAtom(NextSliderPositionAtom);

  const seekToPosition = useCallback(
    async (progress: number) => {
      await MusicControls.seekTo(progress);
      setUpdateInterval(1);

      // Helps prevents "rubberbanding".
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setNextSliderPosition(null);
        setUpdateInterval(200);
      }, 200);
    },
    [setNextSliderPosition],
  );

  return {
    position: nextSliderPosition ?? position,
    setPosition: setNextSliderPosition,
    seekToPosition,
  };
}
