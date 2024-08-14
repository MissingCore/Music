import { useEffect } from "react";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from "react-native-track-player";

/**
 * Sets up `react-native-track-player`. Non-blocking as if `setupPlayer()`
 * fails due to issues such as "The player has already been initialized
 * via setupPlayer.", it shouldn't prevent the rest of the app from loading.
 */
export function useSetupTrackPlayer() {
  useEffect(() => {
    setupPlayer();
  }, []);
}

async function setupPlayer() {
  try {
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
      icon: require("@/resources/images/music-glyph.png"),
    });
  } catch (err) {
    // Gracefully resolve setup error.
    console.log(`[Error]`, (err as Error)?.message);
  }
}
