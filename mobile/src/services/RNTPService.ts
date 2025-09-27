import { toast } from "@backpackapp-io/react-native-toast";
import BackgroundTimer from "@boterop/react-native-background-timer";
import TrackPlayer, { Event } from "@weights-ai/react-native-track-player";

import i18next from "~/modules/i18n";
import { addPlayedMediaList, addPlayedTrack } from "~/api/recent";
import { deleteTrack } from "~/api/track";
import type { TrackStatus } from "~/modules/media/services/Music";
import { Queue, RNTPManager, musicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { getIsPlaying } from "~/modules/media/hooks/useIsPlaying";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import { userPreferencesStore } from "./UserPreferences";
import { router } from "~/navigation/utils/router";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";

/** Context to whether we should resume playback after ducking. */
let resumeAfterDuck: boolean = false;

/** Whether `lastPosition` can be ignored - ie: when we're skipping tracks. */
let resolvedLastPosition = false;
/** Increase playback count after a certain duration of play time. */
let playbackCountUpdator: ReturnType<typeof BackgroundTimer.setTimeout> | null =
  null;

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

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    ({ position }) => {
      musicStore.setState({ lastPosition: position });
    },
  );

  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    // Keep playing media when an interruption is detected.
    if (userPreferencesStore.getState().ignoreInterrupt) return;
    if (e.permanent) {
      await MusicControls.stop();
    } else {
      if (e.paused) {
        resumeAfterDuck = await getIsPlaying();
        await MusicControls.pause();
      } else if (resumeAfterDuck) {
        await MusicControls.play();
        resumeAfterDuck = false;
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
    if (e.index === undefined || e.track === undefined) return;

    // When this triggers for the 1st time, we want to see if we should seek
    // to the last played position.
    const { _hasRestoredPosition, _restoredTrackId, activeId, lastPosition } =
      musicStore.getState();
    if (!_hasRestoredPosition) {
      musicStore.setState({ _hasRestoredPosition: true });
      if (
        lastPosition !== undefined &&
        _restoredTrackId !== undefined &&
        _restoredTrackId === activeId
      ) {
        await MusicControls.seekTo(lastPosition);
      }
    }

    const { playingSource, repeat, queueList } = musicStore.getState();
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
      if (
        nextTrack.activeId === undefined ||
        nextTrack.activeId === activeTrack.id
      ) {
        // There was some cases of displaying the following track when letting
        // the next track play naturally. This should prevent those cases.
        musicStore.setState(nextTrack);
      } else {
        console.log(
          `Got "${nextTrack.activeId}" from \`RNTPManager.getNextTrack()\` when playing track is "${activeTrack.id}".`,
        );
      }

      // Check if we should pause after looping logic.
      if (nextTrack.listIdx === 0 && repeat === "no-repeat") {
        await MusicControls.pause();
        await TrackPlayer.seekTo(0);
      }
    }

    if (playbackCountUpdator !== null) {
      BackgroundTimer.clearTimeout(playbackCountUpdator);
    }
    // Only mark a track as played after we play 10s of it. This prevents
    // the track being marked as "played" if we skip it.
    if (lastPosition === undefined || resolvedLastPosition) {
      // Track should start playing at 0s.
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrack.id),
        Math.min(activeTrack.duration!, 10) * 1000,
      );
    } else if (lastPosition < 10) {
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrack.id),
        (Math.min(activeTrack.duration!, 10) - lastPosition) * 1000,
      );
    }
    if (!resolvedLastPosition) {
      if (playingSource) await addPlayedMediaList(playingSource);
      resolvedLastPosition = true;
    }

    if (e.index === 1) await TrackPlayer.remove(0);
    // if (e.index === 1) await TrackPlayer.remove(0);
    await RNTPManager.reloadNextTrack();
    musicStore.setState({ lastPosition: undefined });
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
        router.navigate("HomeScreens", undefined, { pop: true });
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
