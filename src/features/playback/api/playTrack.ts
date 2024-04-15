import { atom } from "jotai";

import { currentTrackDataAsyncAtom, currentTrackIdAtom } from "./currentTrack";
import { soundRefAtom } from "./globalSound";

/** @description Whether a track is currently playing. */
export const isPlayingAtom = atom(false);

/** @description Asynchronous write-only atom that plays the specified track. */
export const playNewTrackAtom = atom(
  null,
  async (get, set, trackId: string, uri: string) => {
    // FIXME: If we run this function in quick succession, we'll can
    // potentially encounter an `Error: The Sound is already loading`.
    const soundRef = get(soundRefAtom);
    await soundRef.unloadAsync();
    await soundRef.loadAsync({ uri });
    await soundRef.playAsync();

    set(currentTrackIdAtom, trackId);
    set(isPlayingAtom, true);
  },
);

/**
 * @description Asynchronous write-only atom that toggle `isPlaying` and
 *  will play or pause the current playing track.
 */
export const toggleIsPlayingAtom = atom(null, async (get, set) => {
  const isPlaying = get(isPlayingAtom);
  const soundRef = get(soundRefAtom);
  const currentTrackData = await get(currentTrackDataAsyncAtom);
  if (!currentTrackData) return;

  const trackStatus = await soundRef.getStatusAsync();

  if (trackStatus.isLoaded) {
    if (isPlaying) await soundRef.pauseAsync();
    else await soundRef.playAsync();
  } else {
    // If no track is loaded, we assume `isPlaying = false`. This usually
    // occurs when we click the "play button" for the first time after the
    // app loads.
    await soundRef.loadAsync({ uri: currentTrackData.uri });
    await soundRef.playAsync();
  }

  set(isPlayingAtom, !isPlaying);
});
