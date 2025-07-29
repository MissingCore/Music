import { and, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { playedMediaLists, tracks } from "~/db/schema";

import type { PlayListSource } from "~/modules/media/types";

//#region PATCH Methods
/** Update information about an already played list. */
export async function updatePlayedMediaList({
  oldSource,
  newSource,
}: Record<"oldSource" | "newSource", PlayListSource>) {
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
/**
 * Insert a new recently played media list, or updating an existing one.
 * Returns the created entry.
 */
export async function addPlayedMediaList(entry: PlayListSource) {
  const lastPlayedAt = Date.now();
  return (
    await db
      .insert(playedMediaLists)
      .values({ ...entry, lastPlayedAt })
      .onConflictDoUpdate({
        target: [playedMediaLists.id, playedMediaLists.type],
        set: { lastPlayedAt },
      })
      .returning()
  )[0];
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

//#region DELETE Methods
/** Delete specified `PlayedMediaList` entry. */
export async function removePlayedMediaList(entry: PlayListSource) {
  return db
    .delete(playedMediaLists)
    .where(
      and(
        eq(playedMediaLists.id, entry.id),
        eq(playedMediaLists.type, entry.type),
      ),
    );
}
//#endregion
