import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from "react-native-track-player";

/** Initialize the RNTP player from `react-native-track-player`. */
export async function initPlayer(args?: { suppress?: boolean }) {
  try {
    await TrackPlayer.setupPlayer();
  } catch (_err) {
    const err = _err as Error & { code?: string };
    if (!args?.suppress) console.log(`[RNTP Error] ${err.code}`);
    return err.code;
  }
}

/** Set some configurations on the player after successfully intializing it. */
export async function setPlayerConfigs() {
  // Repeat mode is needed for the "next" button to show up in the widget
  // if we're on the last track.
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);

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
}
