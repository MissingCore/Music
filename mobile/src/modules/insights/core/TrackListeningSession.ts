// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { sql } from "drizzle-orm";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

import { playbackStore } from "~/stores/Playback/store";

type ListeningSession = {
  trackId: string;
  /** When we recorded as first playing the track in `ms` since epoch. */
  playedAt: number;
  /** When we have started/resumed the given session in `ms` since epoch. */
  startedAt: number;
  /** How long we played this track for so far in seconds. */
  playTime: number;
  eventId?: string;
};

export const TrackListeningSession = createTrackListeningSession();

//#region Internal Helpers
const MIN_PLAY_TIME = 10;

function createTrackListeningSession() {
  let hasPaused = false;
  let session: ListeningSession | null = null;

  function reset() {
    hasPaused = false;
    session = null;
  }

  return {
    /**
     * Start tracking the playback of the playing track. This will only be
     * called when a new track is played.
     */
    start: async (uri: string) => {
      if (!playbackStore.getState().isPlaying) return reset();
      const track = await db.query.tracks.findFirst({
        columns: { id: true },
        where: (fields, { eq }) => eq(fields.uri, uri),
      });
      if (!track) return reset();

      hasPaused = false;
      session = {
        trackId: track.id,
        playedAt: Date.now(),
        startedAt: Date.now(),
        playTime: 0,
        eventId: undefined,
      };
    },

    resume: async () => {
      //? This may get called in other situations such as when we seek or
      //? play a different track.
      if (!session || !hasPaused) return;
      hasPaused = false;
      session.startedAt = Date.now();
    },

    /** Take a snapshot of the playback of the current track. */
    finalize: async ({ paused = false }: { paused?: boolean } = {}) => {
      if (!session) return;

      const { eventId, trackId, playedAt } = session;
      const { elapsedTime, nextTime } = derivePlayTimes(session);

      if (nextTime > MIN_PLAY_TIME) {
        //? If `eventId` is defined, we just want to add the elapsed time
        //? to the existing value.
        const playTime = eventId ? elapsedTime : nextTime;
        const [sessionEvent] = await db
          .insert(tracksPlayEvents)
          .values({ id: eventId, trackId, playedAt, playTime })
          .onConflictDoUpdate({
            target: tracksPlayEvents.id,
            set: {
              playTime: sql`${tracksPlayEvents.playTime} + ${playTime}`,
            },
          })
          .returning({ id: tracksPlayEvents.id });

        if (paused && sessionEvent?.id) session.eventId = sessionEvent.id;
      }

      if (paused) {
        hasPaused = true;
        session.playTime = nextTime;
        session.startedAt = Date.now();
      } else {
        reset();
      }
    },

    reset,
  };
}

function derivePlayTimes({ startedAt, playTime }: ListeningSession) {
  const elapsedTime = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  //? Necessary in the situation where `playTime < 10`.
  const nextTime = playTime + elapsedTime;
  return { elapsedTime, nextTime };
}
//#endregion
