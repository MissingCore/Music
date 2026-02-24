import { and, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { playedMediaLists, tracks } from "~/db/schema";

import type { PlayFromSource } from "~/stores/Playback/types";

//#region PATCH Methods
/** Update information about an already played list. */
export async function updatePlayedMediaList({
  oldSource,
  newSource,
}: Record<"oldSource" | "newSource", PlayFromSource>) {
  return db
    .update(playedMediaLists)
    .set(newSource)
    .where(
      and(
        eq(playedMediaLists.id, oldSource.id),
        eq(playedMediaLists.type, oldSource.type),
      ),
    );
}
//#endregion

//#region PUT Methods
/** Insert a new recently played media list, or updating an existing one. */
export async function addPlayedMediaList(entry: PlayFromSource) {
  const lastPlayedAt = Date.now();
  return db
    .insert(playedMediaLists)
    .values({ ...entry, lastPlayedAt })
    .onConflictDoUpdate({
      target: [playedMediaLists.id, playedMediaLists.type],
      set: { lastPlayedAt },
    });
}

/** Update the track's `lastPlayedAt` & `playCount` values. */
export async function addPlayedTrack(id: string) {
  return db
    .update(tracks)
    .set({
      lastPlayedAt: Date.now(),
      playCount: sql`${tracks.playCount} + 1`,
    })
    .where(eq(tracks.id, id));
}
//#endregion
