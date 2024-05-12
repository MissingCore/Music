import { useEffect, useState } from "react";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from "react-native-track-player";

import { usePlaybackServiceFn } from "./usePlaybackServiceFn";

/** @description Sets up `react-native-track-player`. */
export function useSetupTrackPlayer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const playbackService = usePlaybackServiceFn();

  useEffect(() => {
    setupPlayer(playbackService).then(() => {
      setIsInitialized(true);
    });
  }, [playbackService]);

  return { isComplete: isInitialized };
}

async function setupPlayer(playbackService: () => Promise<void>) {
  TrackPlayer.registerPlaybackService(() => playbackService);

  await TrackPlayer.setupPlayer();
  // Repeat mode is needed for the "next" button to show up in the widget.
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);
  // We want to play audio from `expo-av` as we only use
  // `react-native-track-player` for the media controls.
  await TrackPlayer.setVolume(0);

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
  });
}
