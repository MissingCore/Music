import { getDefaultStore } from "jotai";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";

import { MusicControls } from "@/modules/media/services/Playback";
import {
  _currPlayListIdxAtom,
  _currTrackIdAtom,
  _repeatAtom,
} from "@/modules/media/services/Persistent";

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
  const jotaiStore = getDefaultStore();

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await MusicControls.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await MusicControls.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    await MusicControls.next();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await MusicControls.prev();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    await MusicControls.seekTo(position);
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
    if (e.index === undefined) return;
    // Update `_playViewReferenceAtom` when the track changes.
    //  - This allows us to preserve the index of the last track played in one place.
    const prevTrackId = await jotaiStore.get(_currTrackIdAtom);
    const prevListIdx = await jotaiStore.get(_currPlayListIdxAtom);
    if (prevListIdx !== e.index && prevTrackId !== e.track?.id) {
      await jotaiStore.set(_currTrackIdAtom, e.track?.id);
      await jotaiStore.set(_currPlayListIdxAtom, e.index ?? 0);
    }

    // Handle case where we loop back to the beginning of the queue.
    const currQueue = await TrackPlayer.getQueue();
    if (e.index === 0 && prevListIdx === currQueue.length - 1) {
      const shouldRepeat = await jotaiStore.get(_repeatAtom);
      if (!shouldRepeat) await MusicControls.pause();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async (e) => {
    console.log(`[${e.code}] ${e.message}`);
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
