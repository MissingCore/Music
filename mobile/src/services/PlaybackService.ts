import { getDefaultStore } from "jotai";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";

import {
  nextAtom,
  playPauseToggleAtom,
  prevAtom,
  updateTrackPosAtom,
} from "@/features/playback/api/actions";

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
  const jotaiStore = getDefaultStore();

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    jotaiStore.set(playPauseToggleAtom);
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
    jotaiStore.set(playPauseToggleAtom);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    jotaiStore.set(nextAtom);
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    jotaiStore.set(prevAtom);
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    jotaiStore.set(updateTrackPosAtom, e.position);
  });
}

/**
 * Ensure we setup `react-native-track-player` in the foreground in addition
 * to its configurations.
 */
export async function setupPlayer() {
  const setup = async () => {
    try {
      await TrackPlayer.setupPlayer();
    } catch (_err) {
      const err = _err as Error & { code?: string };
      console.log(`[Player Error] ${err.code}`);
      return err.code;
    }
  };

  // `setupPlayer` must be called when app is in the foreground, otherwise,
  // an `'android_cannot_setup_player_in_background'` error will be thrown.
  while ((await setup()) === "android_cannot_setup_player_in_background") {
    // Timeouts will only execute when the app is in the foreground. If
    // it somehow executes in the background, the promise will be rejected
    // and we'll try this again.
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
  }

  // Repeat mode is needed for the "next" button to show up in the widget.
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
