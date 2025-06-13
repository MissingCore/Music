import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { useProgress } from "@weights-ai/react-native-track-player";

import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";

/** Dragging slider position. */
const NextSliderPositionAtom = atom<number | null>(null);

/** Safely manages the visible seekbar position to prevent "rubberbanding". */
export function usePlayerProgress() {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [updateInterval, setUpdateInterval] = useState(200);
  const restoredPosition = useRestorePosition();
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
    position: nextSliderPosition ?? restoredPosition ?? position,
    setPosition: setNextSliderPosition,
    seekToPosition,
  };
}

/** Have the seekbar visually reflect the last saved position. */
function useRestorePosition() {
  const _hasRestoredPosition = useMusicStore(
    (state) => state._hasRestoredPosition,
  );
  const _restoredTrackId = useMusicStore((state) => state._restoredTrackId);
  const activeId = useMusicStore((state) => state.activeId);
  const lastPosition = useMusicStore((state) => state.lastPosition);

  return useMemo(() => {
    if (
      _hasRestoredPosition ||
      lastPosition === undefined ||
      _restoredTrackId === undefined ||
      _restoredTrackId !== activeId
    ) {
      return undefined;
    }
    return lastPosition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasRestoredPosition, activeId]);
}
