// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AudioBrowser from "react-native-audio-browser";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

type ListeningSession = {
  trackId: string;
  /** When we recorded as first playing the track in `ms` since epoch. */
  playedAt: number;
};

export const TrackListeningSession = createTrackListeningSession();

//#region Internal Helpers
const MIN_PLAY_TIME = 10;

function createTrackListeningSession() {
  let session: ListeningSession | null = null;

  function reset() {
    session = null;
  }

  async function finalize() {
    if (!session) return;

    const { trackId, playedAt } = session;
    const playTime = derivePlayTime(playedAt);
    reset();

    if (playTime > MIN_PLAY_TIME) {
      try {
        await db
          .insert(tracksPlayEvents)
          .values({ trackId, playedAt, playTime });
      } catch (err) {
        console.error("[TrackListeningSession] Failed to record event.", err);
      }
    }
  }

  async function start(trackId?: string) {
    await finalize();
    if (!trackId || !AudioBrowser.getPlayingState().playing) return reset();
    session = { trackId, playedAt: Date.now() };
  }

  return {
    /**
     * Start tracking the playback session of the specified track. Finalizes
     * any prior sessions beforehand.
     *
     * This should only be called when a new track is played.
     */
    start,
    /** Log the listening session into our database. */
    finalize,
    reset,
  };
}

function derivePlayTime(startedAt: number) {
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}
//#endregion
