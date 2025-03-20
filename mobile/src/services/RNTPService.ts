import { toast } from "@backpackapp-io/react-native-toast";
import TrackPlayer, { Event } from "react-native-track-player";

import i18next from "~/modules/i18n";
import { deleteTrack } from "~/api/track";
import type { TrackStatus } from "~/modules/media/services/Music";
import { Queue, RNTPManager, musicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import { Router } from "./NavigationStore";
import { userPreferencesStore } from "./UserPreferences";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

/** Context to whether we should resume playback after ducking. */
let resumeAfterDuck: boolean = false;

/** Errors which should cause us to "delete" a track. */
const ValidErrors = [
  "android-io-file-not-found",
  "android-failed-runtime-check",
];

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
    // Keep playing media when an interruption is detected.
    if (userPreferencesStore.getState().ignoreInterrupt) return;
    if (e.permanent) {
      await MusicControls.stop();
    } else {
      if (e.paused) {
        resumeAfterDuck = musicStore.getState().isPlaying;
        await MusicControls.pause();
      } else if (resumeAfterDuck) {
        await MusicControls.play();
        resumeAfterDuck = false;
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
    if (e.index === undefined || e.track === undefined) return;

    const { repeat, queueList } = musicStore.getState();
    const activeTrack = e.track;
    const trackStatus: TrackStatus = activeTrack["music::status"];

    if (trackStatus === "END") {
      return await musicStore.getState().reset();
    } else if (trackStatus === "QUEUE") {
      // Remove 1st item in `queueList` if they're the same (doesn't
      // fire if we manually forced the next track to play - which would
      // cause `e.index` to be `0`).
      if (e.index > 0 && activeTrack.id === queueList[0]) {
        // Update the displayed track (let the `activeId` subscription
        // handle updating `activeTrack`).
        musicStore.setState({ activeId: activeTrack.id, isInQueue: true });
        await Queue.removeAtIndex(0);
      } else {
        musicStore.setState({ isInQueue: true });
      }
    } else if (repeat !== "repeat-one" && trackStatus === undefined) {
      // If `trackStatus = undefined`, it means the player naturally played
      // the next track (which isn't part of `queueList`).

      // Since we played this track naturally, the index hasn't been updated
      // in the store.
      const nextTrack = await RNTPManager.getNextTrack();
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

    if (erroredTrack) {
      // Delete the track that caused the error from certain scenarios.
      //  - We've encountered no code when RNTP naturally plays the next
      //  track that throws an error because it doesn't exist.
      if (ValidErrors.includes(e.code) || e.code === undefined) {
        let errorMessage = "File not found.";
        if (e.code === "android-failed-runtime-check")
          errorMessage =
            "Unexpected runtime error. For example, this may happen if the file has a sample rate greater than or equal to 352.8kHz.";

        await deleteTrack(erroredTrack.id, { errorName: e.code, errorMessage });
        await removeUnusedCategories();
        clearAllQueries();
        Router.navigate("/");
      }

      toast.error(
        i18next.t("template.notFound", { name: erroredTrack.title }),
        ToastOptions,
      );
    }

    // Clear all reference of the current playing track.
    await musicStore.getState().reset();
  });
}
