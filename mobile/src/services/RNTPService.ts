import { toast } from "@backpackapp-io/react-native-toast";
import BackgroundTimer from "@boterop/react-native-background-timer";
import TrackPlayer, {
  Event,
  State,
} from "@weights-ai/react-native-track-player";

import i18next from "~/modules/i18n";
import { addPlayedTrack } from "~/api/recent";
import { deleteTrack } from "~/api/track";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import { router } from "~/navigation/utils/router";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { bgWait } from "~/utils/promise";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";
import { extractTrackId, formatTrackforPlayer } from "~/stores/Playback/utils";

/** Context to whether we should resume playback after ducking. */
let resumeAfterDuck: boolean = false;

/** Increase playback count after a certain duration of play time. */
let playbackCountUpdator: ReturnType<typeof BackgroundTimer.setTimeout> | null =
  null;

/** Duration of active track to check against with experimental smooth transitions. */
let smoothTransitionContext = { trackDuration: -1, hasLoaded: false };

/** Errors which should cause us to "delete" a track. */
const ValidErrors = [
  "android-io-file-not-found",
  "android-failed-runtime-check",
];

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.ServiceKilled, async () => {
    await revalidateWidgets({ openApp: true });
  });

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await PlaybackControls.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await PlaybackControls.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    await PlaybackControls.next();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await PlaybackControls.prev();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    await PlaybackControls.seekTo(position);
  });

  TrackPlayer.addEventListener(Event.PlaybackState, (e) => {
    // Only place where we get notified for unexpected pauses such as
    // when disconnecting headphones.
    if (e.state === State.Paused) playbackStore.setState({ isPlaying: false });
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (e) => {
    playbackStore.setState({ lastPosition: e.position });

    const { repeat } = playbackStore.getState();
    const { playbackDelay, smoothPlaybackTransition } =
      preferenceStore.getState();
    if (
      //? Ignore if we're repeating the current track.
      repeat !== RepeatModes.REPEAT_ONE &&
      //? "Natural Playback Delay" & "Smooth Playback Transition" are mutually
      //? exclusive features.
      playbackDelay === 0 &&
      smoothPlaybackTransition &&
      !smoothTransitionContext.hasLoaded &&
      //? Load the next track 2s before the current track ends to minimize the
      //? need of resynchronizing the next track.
      e.position + 2 - smoothTransitionContext.trackDuration > 0
    ) {
      smoothTransitionContext.hasLoaded = true;
      const nextTrack = await PlaybackControls.getNextTrack();
      // Ensure that we handle "No Repeat" mode cleanly (no sound bleed).
      if (
        !nextTrack ||
        (nextTrack.queuePosition === 0 && repeat === RepeatModes.NO_REPEAT)
      ) {
        return;
      }
      // Load the next track into the queue for smoother playback.
      await TrackPlayer.add(formatTrackforPlayer(nextTrack.activeTrack));
    }
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    // Keep playing media when an interruption is detected.
    if (preferenceStore.getState().ignoreInterrupt) return;
    if (e.permanent) {
      await PlaybackControls.stop();
    } else {
      if (e.paused) {
        resumeAfterDuck = playbackStore.getState().isPlaying;
        await PlaybackControls.pause();
      } else if (resumeAfterDuck) {
        await PlaybackControls.play();
        resumeAfterDuck = false;
      }
    }
  });

  // Only triggered if repeat mode is `RepeatMode.Off`. This is also called
  // after the `ServiceKilled` event is emitted.
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    const { playbackDelay } = preferenceStore.getState();
    if (playbackDelay > 0) await bgWait(playbackDelay * 1000);

    // `true` provided to prevent updating the repeat setting.
    await PlaybackControls.next(true);
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
    if (e.index === undefined || e.track === undefined) return;

    // When this triggers for the 1st time, we want to see if we should seek
    // to the last played position.
    const {
      _hasRestoredPosition,
      _restoredTrackKey,
      lastPosition,
      activeTrack,
    } = playbackStore.getState();

    //* Restore Last Played Position
    if (!_hasRestoredPosition) {
      playbackStore.setState({ _hasRestoredPosition: true });
      if (
        _restoredTrackKey !== undefined &&
        extractTrackId(_restoredTrackKey) === activeTrack?.id
      ) {
        // Fallback to `0` to support legacy behavior where we could store `undefined`.
        await PlaybackControls.seekTo(lastPosition ?? 0);
      }
    }

    //* 🧪 Smooth Playback Transition
    const { smoothPlaybackTransition } = preferenceStore.getState();
    if (
      smoothPlaybackTransition &&
      //? Check for `hasLoaded` as otherwise, the `prev` controls won't work.
      smoothTransitionContext.hasLoaded &&
      e.index !== 0
    ) {
      const nextTrack = await PlaybackControls.getNextTrack();
      playbackStore.setState(nextTrack!);

      try {
        // Ensure the RNTP Queue stores a single track.
        await TrackPlayer.remove([...new Array(e.index).keys()]);
      } catch (err) {
        console.log(err);
      }
    }
    smoothTransitionContext = {
      trackDuration: activeTrack!.duration,
      hasLoaded: false,
    };

    //* Play Count Tracking
    if (playbackCountUpdator !== null) {
      BackgroundTimer.clearTimeout(playbackCountUpdator);
    }
    // Only mark a track as played after we play 10s of it. This prevents
    // the track being marked as "played" if we skip it.
    if (lastPosition < 10) {
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrack!.id),
        (Math.min(activeTrack!.duration, 10) - lastPosition) * 1000,
      );
    }

    await revalidateWidgets();
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
        // Attempt to play the next track.
        await Queue.removeIds([erroredTrack.id]);
        await removeUnusedCategories();
        clearAllQueries();

        // If the queue is empty as a result of `Queue.removeIds()`, `reset()`
        // gets called internally, in which, we want to return to the Home screens.
        if (playbackStore.getState().queue.length === 0) {
          router.navigate("HomeScreens", undefined, { pop: true });
        }
      }

      toast.error(
        i18next.t("template.notFound", { name: erroredTrack.title }),
        ToastOptions,
      );
    } else {
      // If we get this event when there's no active track, just reset.
      await playbackStore.getState().reset();
    }
  });
}
