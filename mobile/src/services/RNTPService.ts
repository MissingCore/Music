import BackgroundTimer from "@boterop/react-native-background-timer";
import {
  GlyphButton,
  GlyphToy,
  MatrixAction,
} from "@missingcore/music-glyph-toys";
import { toast } from "@missingcore/toast";
import AudioBrowser from "react-native-audio-browser";

import { db } from "~/db";

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
import { bgWait } from "~/utils/promise";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";

/** Simple method of tracking whether a different track is being played. */
let prevTrackUri: string | undefined;
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
const ValidErrors = ["io-file-not-found", "failed-runtime-check"];

/** The list of track URIs which have errored. */
const erroredTrackUris = new Set<string>();

/** How we handle the actions in the media control notification. */
export async function PlaybackService() {
  GlyphButton.onMount(() => GlyphToy.connect());

  GlyphButton.onTouchUp(async ({ action }) => {
    if (action === MatrixAction.PLAY_PAUSE) await PlaybackControls.playToggle();
    if (action === MatrixAction.SKIP) await PlaybackControls.next();
  });

  AudioBrowser.handleBeforeServiceKilled(async () => {
    if (!preferenceStore.getState().continuePlaybackOnDismiss)
      await revalidateWidgets({ openApp: true });
  });

  AudioBrowser.handleRemotePlay(PlaybackControls.play);
  AudioBrowser.handleRemotePause(PlaybackControls.pause);
  AudioBrowser.handleRemoteNext(PlaybackControls.next);
  AudioBrowser.handleRemotePrevious(PlaybackControls.prev);
  AudioBrowser.handleRemoteSeek(async ({ position }) => {
    await PlaybackControls.seekTo(position);
  });

  AudioBrowser.onPlaybackChanged.addListener((e) => {
    // Only place where we get notified for unexpected pauses such as
    // when disconnecting headphones.
    if (e.state === "paused") playbackStore.setState({ isPlaying: false });
  });

  AudioBrowser.onProgressUpdated.addListener(async (e) => {
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
      AudioBrowser.add(formatTrackforPlayer(nextTrackInfo.activeTrack));
    }
  });

  // Only triggered if repeat mode is `RepeatMode.Off`. This is also called
  // after the `ServiceKilled` event is emitted.
  AudioBrowser.onQueueEnded.addListener(async () => {
    const { playbackDelay } = preferenceStore.getState();
    if (playbackDelay > 0) await bgWait(playbackDelay * 1000);

    // `true` provided to prevent updating the repeat setting.
    await PlaybackControls.next(true);
  });

  AudioBrowser.onActiveTrackChanged.addListener(async (e) => {
    if (e.index === undefined || e.track === undefined) return;

    const activeTrackUri = e.track.src;

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
        AudioBrowser.remove([...new Array(e.index).keys()]);
      } else {
        // Cleans up the RNTP queue if we use the media controls within the track loading window.
        AudioBrowser.removeUpcomingTracks();
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
      isNaturalPlayback || prevTrackUri !== activeTrackUri ? 0 : lastPosition;
    // Only mark a track as played after we pass the 10s mark. This prevents
    // the track being marked as "played" if we skip it.
    if (startAt < 10) {
      playbackCountUpdator = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrackUri),
        (Math.min(e.track.duration!, 10) - startAt) * 1000,
      );
    }

    //! To fix an issue where the media notification looked funny when
    //! there was no embedded artwork, we added a fallback of
    //! `require("~/resources/images/music-glyph.png")`. This caused an
    //! issue due to `GlyphToy.setMatrixArtwork` expecting `string | null`.
    let trackArtwork = e.track?.artwork || null;
    if (typeof trackArtwork !== "string") trackArtwork = null;
    GlyphToy.setMatrixArtwork(trackArtwork);

    await revalidateWidgets();
    prevTrackUri = activeTrackUri;
  });

  AudioBrowser.onPlaybackError.addListener(async ({ error: e }) => {
    if (!e) return;

    //? We don't know exactly what track caused the error, but we can
    //? infer based on the state of the queue.
    const [activeTrack, queuedTrack] = AudioBrowser.getQueue();
    const erroredTrack = (queuedTrack || activeTrack) as AudioBrowser.Track;

    if (erroredTrack.src) {
      //! For some weird reason, `PlaybackError` may fire twice for a given track.
      if (erroredTrackUris.has(erroredTrack.src)) return;
      erroredTrackUris.add(erroredTrack.src);

      const erroredTrackObj = await db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.uri, erroredTrack.src!),
      });
      // Reset if the track doesn't exist in the database.
      if (!erroredTrackObj) return await playbackStore.getState().reset();

      //? If the errored track was queued, we need to update the store.
      if (queuedTrack) {
        const nextTrack = await PlaybackControls.getNextTrack();
        if (nextTrack) playbackStore.setState(nextTrack);
        nextTrackInfo = undefined;
      }

      // Delete the track that caused the error from certain scenarios.
      //  - We've encountered no code when RNTP naturally plays the next
      //  track that throws an error because it doesn't exist.
      if (ValidErrors.includes(e.code) || e.code === undefined) {
        let errorMessage = "File not found.";
        if (e.code === "failed-runtime-check")
          errorMessage =
            "Unexpected runtime error. For example, this may happen if the file has a sample rate greater than or equal to 352.8kHz.";

        await deleteTracks([
          {
            id: erroredTrackObj.id,
            errorInfo: { errorName: e.code, errorMessage },
          },
        ]);
        // Attempt to play the next track.
        await Queue.removeIds([erroredTrackObj.id]);
        await AppCleanUp.media();
        clearAllQueries();

        // If the queue is empty as a result of `Queue.removeIds()`, `reset()`
        // gets called internally, in which, we want to return to the Home screens.
        if (playbackStore.getState().queue.length === 0) {
          router.navigate("HomeScreens", undefined, { pop: true });
        }
      }

      toast.error(i18next.t("template.notFound", { name: erroredTrack.title }));
    } else {
      // If we get this event when there's no active track, just reset.
      await playbackStore.getState().reset();
    }
  });
}
