import { Audio, InterruptionModeAndroid } from "expo-av";
import { useAtom, useAtomValue } from "jotai";
import { createContext, useCallback, useContext, useRef } from "react";

import {
  currentTrackDataAtom,
  currentTrackIdAtom,
  isPlayingAtom,
} from "../store";

type TPlaybackContext = {
  isPlaying: boolean;
  toggleIsPlaying: () => void;
  playNewTrack: (trackId: string, uri: string) => void;
};

const PlaybackContext = createContext<TPlaybackContext | null>(null);

/**
 * @description Provides functions & values for interacting with the
 *  current playing song.
 */
export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef(new Audio.Sound());

  const [currentTrackId, setCurrentTrackId] = useAtom(currentTrackIdAtom);
  const currentTrack = useAtomValue(currentTrackDataAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

  console.log(currentTrackId, currentTrack);

  /**
   * @description Toggle the play status of the current track. If no
   *  track is loaded (ie: on app load), load the current track.
   */
  const toggleIsPlaying = useCallback(async () => {
    if (!currentTrack) return;
    const trackStatus = await soundRef.current.getStatusAsync();

    if (trackStatus.isLoaded) {
      if (isPlaying) await soundRef.current.pauseAsync();
      else {
        // FIXME: We need to eventually account for scrubbing.
        await soundRef.current.playAsync();
      }
    } else {
      // If no song is loaded, we assume `isPlaying = false`.
      await soundRef.current.loadAsync({ uri: currentTrack.uri });
      await soundRef.current.playAsync();
    }

    setIsPlaying((prev) => !prev);
  }, [isPlaying, setIsPlaying, currentTrack]);

  /** @description Play a new track. */
  const playNewTrack = useCallback(
    async (trackId: string, uri: string) => {
      // FIXME: Need to fix case w/ fast clicks
      await soundRef.current.unloadAsync();
      await soundRef.current.loadAsync({ uri });
      await soundRef.current.playAsync();
      setCurrentTrackId(trackId);

      setIsPlaying(true);
    },
    [setCurrentTrackId, setIsPlaying],
  );

  return (
    <PlaybackContext.Provider
      value={{ isPlaying, toggleIsPlaying, playNewTrack }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

/** @description Entrance for accessing PlaybackContext. */
export function usePlaybackContext() {
  const value = useContext(PlaybackContext);
  if (value === null) throw Error("Cannot use outside of PlaybackProvider.");
  return value;
}
