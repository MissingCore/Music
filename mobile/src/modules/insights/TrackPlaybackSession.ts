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
    //? This may get called in other situations such as when we seek or
    //? play a different track.
    if (!this.session || !this.hasPaused) return;
    this.hasPaused = false;
    this.session.startedAt = Date.now();
  }

  /** Take a snapshot of the playback of the current track. */
  async finalize({ paused = false }: { paused?: boolean } = {}) {
    if (!this.session) return;

    const { eventId, trackId, playedAt } = this.session;
    const { elapsedTime, nextTime } = derivePlayTimes(this.session);

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
  const elapsedTime = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  //? Necessary in the situation where `playTime < 10`.
  const nextTime = playTime + elapsedTime;
  return { elapsedTime, nextTime };
}
//#endregion
