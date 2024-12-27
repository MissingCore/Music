import { toast } from "@backpackapp-io/react-native-toast";
import { router } from "expo-router";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";

import i18next from "@/modules/i18n";
import { deleteTrack } from "@/api/track";
import type { TrackStatus } from "@/modules/media/services/Music";
import { Queue, RNTPManager, musicStore } from "@/modules/media/services/Music";
import { MusicControls } from "@/modules/media/services/Playback";
import { removeUnusedCategories } from "@/modules/scanning/helpers/audio";

import { clearAllQueries } from "@/lib/react-query";
import { ToastOptions } from "@/lib/toast";
import { wait } from "@/utils/promise";

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

    const { repeat, queuedTrackList } = musicStore.getState();
    const activeTrack = e.track!;
    const trackStatus: TrackStatus = activeTrack["music::status"];

    if (trackStatus === "END") {
      return await musicStore.getState().reset();
    } else if (trackStatus === "QUEUE") {
      // Remove 1st item in `queueList` if they're the same (doesn't
      // fire if we manually forced the next track to play - which would
      // cause `e.index` to be `0`).
      if (e.index > 0 && activeTrack.id === queuedTrackList[0]?.id) {
        // Update the displayed track.
        musicStore.setState({
          activeId: activeTrack.id,
          activeTrack: queuedTrackList[0],
          isInQueue: true,
        });
        await Queue.removeAtIndex(0);
      } else {
        musicStore.setState({ isInQueue: true });
      }
    } else if (repeat !== "repeat-one" && trackStatus === undefined) {
      // If `trackStatus = undefined`, it means the player naturally played
      // the next track (which isn't part of `queueList`).

      // Since we played this track naturally, the index hasn't been updated
      // in the store.
      const nextTrack = RNTPManager.getNextTrack();
      musicStore.setState(nextTrack);

      // Check if we should pause after looping logic.
      if (nextTrack.listIdx === 0 && repeat === "no-repeat") {
        await MusicControls.pause();
        await TrackPlayer.seekTo(0);
      }
    }

    if (e.index === 1) await TrackPlayer.remove(0);
    await RNTPManager.reloadNextTrack();
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
      await removeUnusedCategories();
      clearAllQueries();
      router.navigate("/");
    }

    toast.error(
      i18next.t("template.notFound", { name: erroredTrack?.title }),
      ToastOptions,
    );
    // Clear all reference of the current playing track.
    await musicStore.getState().reset();
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
    await wait(1);
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
