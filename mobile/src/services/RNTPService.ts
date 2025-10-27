import { toast } from "@backpackapp-io/react-native-toast";
import BackgroundTimer from "@boterop/react-native-background-timer";
import TrackPlayer, {
  Event,
  State,
} from "@weights-ai/react-native-track-player";

import i18next from "~/modules/i18n";
import { addPlayedMediaList, addPlayedTrack } from "~/api/recent";
import { deleteTrack } from "~/api/track";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import { userPreferencesStore } from "./UserPreferences";
import { router } from "~/navigation/utils/router";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { revalidateWidgets } from "~/modules/widget/utils";
import { extractTrackId } from "~/stores/Playback/utils";

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

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (e) => {
    playbackStore.setState({ lastPosition: e.position });
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    // Keep playing media when an interruption is detected.
    if (userPreferencesStore.getState().ignoreInterrupt) return;
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
      playingFrom,
      activeTrack,
    } = playbackStore.getState();
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

    if (playbackCountUpdator !== null) {
      BackgroundTimer.clearTimeout(playbackCountUpdator);
    }
    // Only mark a track as played after we play 10s of it. This prevents
    // the track being marked as "played" if we skip it.
    if (resolvedLastPosition) {
      // Track should start playing at 0s.
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrack!.id),
        Math.min(activeTrack!.duration, 10) * 1000,
      );
    } else if (lastPosition < 10) {
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrack!.id),
        (Math.min(activeTrack!.duration, 10) - lastPosition) * 1000,
      );
    }
    if (!resolvedLastPosition) {
      if (playingFrom) await addPlayedMediaList(playingFrom);
      resolvedLastPosition = true;
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
    await playbackStore.getState().reset();
  });
}
