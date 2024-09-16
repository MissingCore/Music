import { router } from "expo-router";
import { Toast } from "react-native-toast-notifications";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";

import { deleteTrack } from "@/db/queries";

import {
  removeUnlinkedAlbums,
  removeUnlinkedArtists,
} from "@/features/indexing/api/db-cleanup";
import { MusicControls } from "@/modules/media/services/Playback";
import {
  AsyncAtomState,
  Queue,
  RNTPManager,
  resetState,
} from "@/modules/media/services/State";

import { getAtom, setAtom } from "@/lib/jotai";
import { clearAllQueries } from "@/lib/react-query";

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
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

  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.permanent) {
      await MusicControls.stop();
    } else {
      if (e.paused) await MusicControls.pause();
      else await MusicControls.play();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
    if (e.index === undefined) return;

    const activeTrack = e.track!;
    const trackStatus: "QUEUE" | "END" | "RELOAD" | undefined =
      activeTrack["music::status"];

    if (trackStatus === "END") {
      await resetState();
      return;
    } else if (trackStatus === "QUEUE") {
      // Remove 1st item in `queueList` if they're the same.
      if (activeTrack.id === (await getAtom(AsyncAtomState.queueList))[0]) {
        await Queue.removeAtIndex(0);
      }
    } else if (trackStatus === undefined) {
      // If `trackStatus = undefined`, it means we're playing the next track
      // "naturally" and should update the index & values accordingly.
      const currList = await getAtom(AsyncAtomState.currentList);
      const prevIdx = await getAtom(AsyncAtomState.currPlayingIdx);
      const newIdx = prevIdx === currList.length - 1 ? 0 : prevIdx + 1;
      await setAtom(AsyncAtomState.currPlayingIdx, newIdx);
      await setAtom(AsyncAtomState.currPlayingId, activeTrack.id);

      // Check if we should pause after looping logic.
      if (newIdx === 0) {
        const shouldRepeat = await getAtom(AsyncAtomState.repeat);
        if (!shouldRepeat) await MusicControls.pause();
      }
    }

    if (e.index === 1) await TrackPlayer.remove(0);
    await RNTPManager.refreshNextTrack();
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async (e) => {
    // When this event is called, `TrackPlayer.getActiveTrack()` should
    // contain the track that caused the error.
    const erroredTrack = await TrackPlayer.getActiveTrack();
    console.log(`[${e.code}] ${e.message}`, erroredTrack);

    // Delete the track that caused the error if we encounter either an
    // `android-io-file-not-found` error code or no code.
    //  - We've encountered no code when RNTP naturally plays the next
    //  track that throws an error because it doesn't exist.
    if (
      erroredTrack?.id &&
      (e.code === "android-io-file-not-found" || e.code === undefined)
    ) {
      await deleteTrack(erroredTrack.id);
      await removeUnlinkedAlbums();
      await removeUnlinkedArtists();
      clearAllQueries();
      router.navigate("/");
    }

    Toast.show("Track no longer exists.", { type: "danger", duration: 3000 });
    // Clear all reference of the current playing track.
    await resetState();
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
