import { toast } from "@backpackapp-io/react-native-toast";
import BackgroundTimer from "@boterop/react-native-background-timer";
import {
  GlyphButton,
  GlyphToy,
  MatrixAction,
} from "@missingcore/music-glyph-toys";
import TrackPlayer, { Event, State } from "react-native-track-player";

import i18next from "~/modules/i18n";
import { addPlayedTrack } from "~/data/recent/api";
import { deleteTracks } from "~/data/track/api";
import { formatTrackforPlayer } from "~/data/track/utils";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { sessionStore } from "~/stores/Session/store";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";
import { router } from "~/navigation/utils/router";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { bgWait } from "~/utils/promise";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";

/** Simple method of tracking whether a different track is being played. */
let prevTrackId = "";
/** Increase playback count after a certain duration of play time. */
let playbackCountUpdator: ReturnType<typeof BackgroundTimer.setTimeout> | null =
  null;

/** Duration of active track to check against with experimental smooth transitions. */
let smoothTransitionContext = { trackDuration: -1, hasLoaded: false };
/**
 * Stores information about the next track. This can't be used for `hasLoaded` as
 * `hasLoaded` will change immediately while `nextTrackInfo` is async.
 */
let nextTrackInfo:
  | Awaited<ReturnType<typeof PlaybackControls.getNextTrack>>
  | undefined;

/** Errors which should cause us to "delete" a track. */
const ValidErrors = [
  "android-io-file-not-found",
  "android-failed-runtime-check",
];

/** The list of track ids which have errored. */
const erroredTrackIds = new Set<string>();

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
  GlyphButton.onMount(() => GlyphToy.connect());

  GlyphButton.onTouchUp(async ({ action }) => {
    if (action === MatrixAction.PLAY_PAUSE) await PlaybackControls.playToggle();
    if (action === MatrixAction.SKIP) await PlaybackControls.next();
  });

  TrackPlayer.addEventListener(Event.ServiceKilled, async () => {
    await revalidateWidgets({ openApp: true });
  });

  //? On some devices (so far OnePlus 6), only `RemotePlayPause` is fired
  //? instead of `RemotePlay` + `RemotePause` from media control notifications.
  TrackPlayer.addEventListener(Event.RemotePlayPause, async () => {
    await PlaybackControls.playToggle();
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
    const { playbackSpeed } = sessionStore.getState();

    // We might not be able to load the next track in time if we change the
    // playback speed.
    const loadingFrame = 5 * Math.max(1, playbackSpeed);
    if (
      //? Ignore if we're repeating the current track.
      repeat !== RepeatModes.REPEAT_ONE &&
      //? "Natural Playback Delay" & "Smooth Playback Transition" are mutually
      //? exclusive features.
      playbackDelay === 0 &&
      smoothPlaybackTransition &&
      !smoothTransitionContext.hasLoaded &&
      //? Load the next track before the current track ends to minimize the
      //? need of resynchronizing the next track.
      e.position + loadingFrame - smoothTransitionContext.trackDuration > 0
    ) {
      smoothTransitionContext.hasLoaded = true;
      nextTrackInfo = await PlaybackControls.getNextTrack();
      // Ensure that we handle "No Repeat" mode cleanly (no sound bleed).
      if (
        !nextTrackInfo ||
        (nextTrackInfo.queuePosition === 0 && repeat === RepeatModes.NO_REPEAT)
      ) {
        return;
      }
      // Load the next track into the queue for smoother playback.
      await TrackPlayer.add(formatTrackforPlayer(nextTrackInfo.activeTrack));
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

    //* 🧪 Smooth Playback Transition
    const { smoothPlaybackTransition } = preferenceStore.getState();
    let isNaturalPlayback = false;
    try {
      if (
        smoothPlaybackTransition &&
        //? Check for `hasLoaded` as otherwise, the `prev` controls won't work.
        smoothTransitionContext.hasLoaded &&
        e.index !== 0 &&
        nextTrackInfo
      ) {
        isNaturalPlayback = true;
        playbackStore.setState(nextTrackInfo);
        // Ensure the RNTP Queue stores a single track.
        await TrackPlayer.remove([...new Array(e.index).keys()]);
      } else {
        // Cleans up the RNTP queue if we use the media controls within the track loading window.
        await TrackPlayer.removeUpcomingTracks();
      }
    } catch (err) {
      console.log(err);
    }
    smoothTransitionContext = {
      trackDuration: e.track.duration!,
      hasLoaded: false,
    };
    nextTrackInfo = undefined;

    //* Play Count Tracking
    const { lastPosition } = playbackStore.getState();

    if (playbackCountUpdator !== null) {
      BackgroundTimer.clearTimeout(playbackCountUpdator);
    }
    // When switching tracks, `lastPosition` will show the value from the prior
    // track. This prevents updating the new track's play count if we manaully
    // swapped tracks or naturally play the next track when `lastPosition > 10`.
    const startAt =
      isNaturalPlayback || prevTrackId !== e.track.id ? 0 : lastPosition;
    // Only mark a track as played after we pass the 10s mark. This prevents
    // the track being marked as "played" if we skip it.
    if (startAt < 10) {
      const activeTrackId: string = e.track.id;
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrackId),
        (Math.min(e.track.duration!, 10) - startAt) * 1000,
      );
    }

    // FIXME: Sentry reporting error that we're getting an object when it expects a string.
    // GlyphToy.setMatrixArtwork(e.track?.artwork || null);
    await revalidateWidgets();
    prevTrackId = e.track.id;
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async (e) => {
    // When this event is called, `TrackPlayer.getActiveTrack()` should
    // contain the track that caused the error.
    const erroredTrack = await TrackPlayer.getActiveTrack();

    //! For some weird reason, `PlaybackError` may fire twice for a given track.
    if (erroredTrack) {
      if (erroredTrackIds.has(erroredTrack.id)) return;
      erroredTrackIds.add(erroredTrack.id);
    }

    if (erroredTrack) {
      // Delete the track that caused the error from certain scenarios.
      //  - We've encountered no code when RNTP naturally plays the next
      //  track that throws an error because it doesn't exist.
      if (ValidErrors.includes(e.code) || e.code === undefined) {
        let errorMessage = "File not found.";
        if (e.code === "android-failed-runtime-check")
          errorMessage =
            "Unexpected runtime error. For example, this may happen if the file has a sample rate greater than or equal to 352.8kHz.";

        await deleteTracks([
          {
            id: erroredTrack.id,
            errorInfo: { errorName: e.code, errorMessage },
          },
        ]);
        // Attempt to play the next track.
        await Queue.removeIds([erroredTrack.id]);
        await AppCleanUp.media();
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
