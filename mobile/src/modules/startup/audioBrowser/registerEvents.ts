// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import AudioBrowser from "react-native-audio-browser";

import { db } from "~/db";

import { CAN_SENTRY_REPORT } from "~/env";
import { deleteTracks } from "~/data/track/api";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { sessionStore } from "~/stores/Session/store";
import { TrackListeningSession } from "~/modules/insights/core/TrackListeningSession";
import { AppCleanUp } from "../scanning/core/cleanup";

import { router } from "~/navigation/utils/router";

import { clearAllQueries } from "~/lib/react-query";
import { Sentry } from "~/lib/sentry";
import { bgWait } from "~/utils/promise";
import { applyReplayGainToTrack } from "~/modules/audio/replayGain/core/apply";
import { revalidateWidgets } from "~/modules/widget/utils";

//#region "Smooth Playback Transition" Constants
type PlaybackStoreFrame = Awaited<
  ReturnType<typeof PlaybackControls.getNextTrack>
>;

let gaplessPlaybackContext = {
  /** If we're preparing to load the next track / the track has been loaded. */
  buffering: false,
  /** Duration of current media. */
  duration: -1,
  /** State the Playback store will be in once the next track is played. */
  nextSnapshot: undefined as PlaybackStoreFrame | undefined,
};
//#endregion

//#region Error Handling Constants
/** Errors which should cause us to "delete" a track. */
const ValidErrors = ["io-file-not-found", "failed-runtime-check"];

/** List of track URIs which have errored. */
const erroredTrackUris = new Set<string>();
//#endregion

/** Register events to handle playback, errors, and tear-down.  */
export function registerEvents() {
  // This event gets called when `appKilledPlaybackBehavior = "stop-playback-and-remove-notification"`.
  AudioBrowser.handleBeforeServiceKilled(async (permanent) => {
    TrackListeningSession.finalize();
    await revalidateWidgets({ openApp: true });
    if (permanent) {
      console.warn("[handleBeforeServiceKilled] Running aggressive cleanup...");
      AudioBrowser.reset();
    }
  });

  AudioBrowser.handleRemotePlay(PlaybackControls.play);
  AudioBrowser.handleRemotePause(PlaybackControls.pause);
  AudioBrowser.handleRemoteNext(PlaybackControls.next);
  AudioBrowser.handleRemotePrevious(PlaybackControls.prev);
  AudioBrowser.handleRemoteSeek(async ({ position }) => {
    await PlaybackControls.seekTo(position);
  });

  // Handle unexpected pauses (ie: disconnecting headphones).
  AudioBrowser.onPlaybackChanged.addListener(async (e) => {
    if (e.state === "paused" || e.state === "stopped") {
      playbackStore.setState({ isPlaying: false });
      await TrackListeningSession.finalize({ paused: true });
    } else if (e.state === "loading") {
      const { repeat, activeTrack } = playbackStore.getState();
      if (repeat === "repeat-one" && activeTrack) {
        await TrackListeningSession.finalize();
        await TrackListeningSession.start(activeTrack.uri);
      }
    } else if (e.state === "playing") {
      playbackStore.setState({ isPlaying: true });
      await TrackListeningSession.resume();
    }
  });

  AudioBrowser.onProgressUpdated.addListener(async (e) => {
    //? Ignore the 1st emitted event as it returns `duration = 0`.
    if (e.duration === 0) return;
    playbackStore.setState({ lastPosition: e.position });

    const { repeat } = playbackStore.getState();
    const { playbackDelay } = preferenceStore.getState();

    // Taking the playback speed into account when optimally loading the next track.
    const loadingFrame = 5 * Math.max(1, sessionStore.getState().playbackSpeed);
    if (
      //? Ignore if we're repeating the current track.
      repeat === "repeat-one" ||
      //? "Natural Playback Delay" & "Smooth Playback Transition" are mutually exclusive features.
      playbackDelay > 0 ||
      //? Prevent recomputation.
      gaplessPlaybackContext.buffering ||
      //? Prevent early computation (when we're not near the end of the track).
      e.position + loadingFrame - gaplessPlaybackContext.duration < 0
    ) {
      return;
    }

    gaplessPlaybackContext.buffering = true;
    gaplessPlaybackContext.nextSnapshot = await PlaybackControls.getNextTrack();
    if (!gaplessPlaybackContext.nextSnapshot) return;
    const { activeTrack, queuePosition } = gaplessPlaybackContext.nextSnapshot;
    //? Ensure that we handle "No Repeat" mode cleanly (no sound bleed).
    if (queuePosition === 0 && repeat === "no-repeat") return;

    // Load the next track into the queue for smoother playback.
    AudioBrowser.add(await applyReplayGainToTrack(activeTrack));
  });

  // Called when "Smooth Playback Transition" doesn't trigger.
  AudioBrowser.onQueueEnded.addListener(async () => {
    await TrackListeningSession.finalize();
    const { playbackDelay } = preferenceStore.getState();
    if (playbackDelay > 0) await bgWait(playbackDelay * 1000);
    await PlaybackControls.next(true); // Prevent updating the repeat setting.
  });

  AudioBrowser.onActiveTrackChanged.addListener(async (e) => {
    if (e.index === undefined || e.track?.src === undefined) return;
    const activeTrackUri = decodeURIComponent(e.track.src);

    //* Smooth Playback Transition
    try {
      if (e.index !== 0 && gaplessPlaybackContext.nextSnapshot) {
        playbackStore.setState(gaplessPlaybackContext.nextSnapshot);
        // Ensure the AudioBrowser Queue stores a single track.
        AudioBrowser.remove([...new Array(e.index).keys()]);
      } else {
        // Cleans up the AudioBrowser queue if we use the media controls within the track loading window.
        AudioBrowser.removeUpcomingTracks();
      }
    } catch (err) {
      console.log(err);
    }
    gaplessPlaybackContext = {
      buffering: false,
      duration: e.track.duration!,
      nextSnapshot: undefined,
    };

    //* Playback Session Tracking (Play Count + Time)
    await TrackListeningSession.finalize();
    await TrackListeningSession.start(activeTrackUri);

    await revalidateWidgets();
  });

  AudioBrowser.onPlaybackError.addListener(async ({ error: e }) => {
    if (!e) return;
    TrackListeningSession.reset();
    if (CAN_SENTRY_REPORT) {
      Sentry.captureException(
        new Error(`[PlaybackError: ${e.code}] ${e.message}`),
      );
    }

    //? We don't know exactly what track caused the error, but we can
    //? infer based on the state of the queue.
    const [activeTrack, queuedTrack] = AudioBrowser.getQueue();
    const erroredTrack = queuedTrack || activeTrack;

    if (erroredTrack?.src) {
      const erroredTrackUri = decodeURIComponent(erroredTrack.src);
      //! For some weird reason, `PlaybackError` may fire twice for a given track.
      if (erroredTrackUris.has(erroredTrackUri)) return;
      erroredTrackUris.add(erroredTrackUri);

      const erroredTrackObj = await db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.uri, erroredTrackUri),
      });
      // Reset if the track doesn't exist in the database.
      if (!erroredTrackObj) return await playbackStore.getState().reset();

      //? If the errored track was queued, we need to update the store.
      if (queuedTrack) {
        const nextTrack = await PlaybackControls.getNextTrack();
        if (nextTrack) playbackStore.setState(nextTrack);
        gaplessPlaybackContext.nextSnapshot = undefined;
      }

      // Delete the track that caused the error from certain scenarios.
      //  - We've encountered no code when AudioBrowser naturally plays
      //  the next track that throws an error because it doesn't exist.
      if (ValidErrors.includes(e.code)) {
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

      toast.error(
        `Something went wrong when playing: ${erroredTrack.title}.\n[${e.code}] ${e.message}`,
      );
    } else {
      // If we get this event when there's no active track, just reset.
      await playbackStore.getState().reset();
    }
  });
}
