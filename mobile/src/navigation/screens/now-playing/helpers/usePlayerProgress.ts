import { useProgress } from "@weights-ai/react-native-track-player";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useMemo, useRef, useState } from "react";

import { seekTo } from "~/stores/Playback/actions";
import { useMusicStore } from "~/modules/media/services/Music";

/** Dragging slider position. */
const NextSliderPositionAtom = atom<number | null>(null);

/** Safely manages the visible seekbar position to prevent "rubberbanding". */
export function usePlayerProgress() {
  const debounceRef = useRef<number>(null);
  const [updateInterval, setUpdateInterval] = useState(200);
  const restoredPosition = useRestorePosition();
  const { position } = useProgress(updateInterval);
  const nextSliderPosition = useAtomValue(NextSliderPositionAtom);
  const setNextSliderPosition = useSetAtom(NextSliderPositionAtom);

  const seekToPosition = async (progress: number) => {
    await seekTo(progress);
    setUpdateInterval(1);

    // Helps prevents "rubberbanding".
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNextSliderPosition(null);
      setUpdateInterval(200);
    }, 200);
  };

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
