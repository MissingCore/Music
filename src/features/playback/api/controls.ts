import { atom } from "jotai";

import { currentTrackDataAsyncAtom, currentTrackIdAtom } from "./currentTrack";
import { soundRefAtom } from "./globalSound";

/** @description Whether a track is currently playing. */
export const isPlayingAtom = atom(false);

/** @description Asynchronous write-only atom that plays the specified track. */
export const playNewTrackAtom = atom(
  null,
  async (get, set, trackId: string, uri: string) => {
    try {
      const soundRef = get(soundRefAtom);
      await soundRef.unloadAsync(); // Needed if we want to replace the current track.
      await soundRef.loadAsync({ uri }, { shouldPlay: true });

      set(currentTrackIdAtom, trackId);
      set(isPlayingAtom, true);
    } catch (err) {
      // Catch cases where media failed to load or if it's already loaded.
      console.log(err);
    }
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
    await soundRef.loadAsync(
      { uri: currentTrackData.uri },
      { shouldPlay: true },
    );
  }

  set(isPlayingAtom, !isPlaying);
});
