import { Audio } from "expo-av";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import type { UseTrackData } from "@/features/track/api/getTrack";
import { useTrack } from "@/features/track/api/getTrack";
import { usePlaybackConfigs } from "../api/getPlaybackConfigs";
import { useUpdateCurrentTrack } from "../api/updateCurrentTrack";

type PlayFnProps = { trackId: string; uri: string };

type TPlaybackContext = {
  currentTrack?: UseTrackData;
  isPlaying: boolean;
  toggleIsPlaying: () => void;
  play: (args: PlayFnProps) => void;
};

const PlaybackContext = createContext<TPlaybackContext | null>(null);

/**
 * @description Provides functions & values for interacting with the
 *  current playing song.
 */
export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  // Note: Using dependent queries (this causes request waterfalls, which is bad for performance)
  const { data: configs } = usePlaybackConfigs();
  const { data: currentTrack } = useTrack(configs?.currentTrack);

  const currentTrackMutation = useUpdateCurrentTrack();

  const soundRef = useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);

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
  }, [isPlaying, currentTrack]);

  const play = useCallback(
    async ({ trackId, uri }: PlayFnProps) => {
      await soundRef.current.unloadAsync();
      await soundRef.current.loadAsync({ uri });
      await soundRef.current.playAsync();
      currentTrackMutation.mutate(trackId);

      setIsPlaying(true);
    },
    [currentTrackMutation],
  );

  return (
    <PlaybackContext.Provider
      value={{ currentTrack, isPlaying, toggleIsPlaying, play }}
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
