// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { eq } from "drizzle-orm";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

type InsertedLyric = typeof lyrics.$inferInsert;

//#region POST Methods
/** Returns the created lyric. */
export async function createLyric(entry: InsertedLyric) {
  const [result] = await db.insert(lyrics).values(entry).returning();
  return result;
}
//#endregion

//#region PATCH Methods
export async function updateLyric(
  trackId: string,
  values: Partial<Omit<InsertedLyric, "trackId">>,
) {
  return db.update(lyrics).set(values).where(eq(lyrics.trackId, trackId));
}
//#endregion

//#region DELETE Methods
export async function deleteLyric(trackId: string) {
  return db.delete(lyrics).where(eq(lyrics.trackId, trackId));
}
//#endregion
