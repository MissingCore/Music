import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

import { playbackStore } from "~/stores/Playback/store";

type Session = {
  trackId: string;
  /** When we recorded as first playing the track. */
  playedAt: number;
  /** When we have started/resumed the given session. */
  startedAt: number;
  /** How long we played this track for so far. */
  playTime: number;
  eventId?: string;
};

const MIN_PLAY_TIME = 10;

export class TrackPlaybackSession {
  hasPaused = false;
  session: Session | null = null;

  /**
   * Start tracking the playback of the playing track. This will only be
   * called when a new track is played.
   */
  async start(uri: string) {
    if (!playbackStore.getState().isPlaying) return this.reset();
    const track = await db.query.tracks.findFirst({
      columns: { id: true },
      where: (fields, { eq }) => eq(fields.uri, uri),
    });
    if (!track) return this.reset();

    this.hasPaused = false;
    this.session = {
      trackId: track.id,
      playedAt: Date.now(),
      startedAt: Date.now(),
      playTime: 0,
      eventId: undefined,
    };
  }

  async resume() {
    if (!this.session || !this.hasPaused) return;
    this.hasPaused = false;
    this.session.startedAt = Date.now();
  }

  /** Take a snapshot of the playback of the current track. */
  async finalize(paused = false) {
    if (!this.session) return;

    const { eventId, trackId, playedAt } = this.session;
    const { elapsedTime, nextTime } = derivePlayTimes(this.session);

    if (nextTime > MIN_PLAY_TIME) {
      const [sessionEvent] = await upsertPlaybackSession({
        id: eventId,
        trackId,
        playedAt,
        //? If `eventId` is defined, we just want to add the elapsed time
        //? to the existing value.
        playTime: eventId ? elapsedTime : nextTime,
      });

      if (paused && sessionEvent?.id) this.session.eventId = sessionEvent.id;
    }

    if (paused) {
      this.hasPaused = true;
      this.session.playTime = nextTime;
      this.session.startedAt = Date.now();
    } else {
      this.reset();
    }
  }

  reset() {
    this.hasPaused = false;
    this.session = null;
  }
}

//#region Internal Helpers
function derivePlayTimes({ startedAt, playTime }: Session) {
  const elapsedPlayTime = Math.max(
    0,
    Math.floor((Date.now() - startedAt) / 1000),
  );
  //? Necessary in the situation where `playTime < 10`.
  const nextPlayTime = playTime + elapsedPlayTime;
  return { elapsedTime: elapsedPlayTime, nextTime: nextPlayTime };
}

async function upsertPlaybackSession(
  args: InferInsertModel<typeof tracksPlayEvents>,
) {
  return db
    .insert(tracksPlayEvents)
    .values(args)
    .onConflictDoUpdate({
      target: tracksPlayEvents.id,
      set: {
        playTime: sql`${tracksPlayEvents.playTime} + ${args.playTime}`,
      },
    })
    .returning({ id: tracksPlayEvents.id });
}
//#endregion
