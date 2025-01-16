import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { tracks, tracksToPlaylists } from "@/db/schema";
import { getTrackCover } from "@/db/utils";

import i18next from "@/modules/i18n";

import { deleteImage } from "@/lib/file-system";
import type { DrizzleFilter, QuerySingleFn } from "./types";

//#region GET Methods
/** Get specified track. Throws error by default if nothing is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getTrack: QuerySingleFn<TrackWithAlbum> = async (
  id,
  shouldThrow = true,
) => {
  const track = await db.query.tracks.findFirst({
    where: eq(tracks.id, id),
    with: { album: true },
  });
  if (!track) {
    if (shouldThrow) throw new Error(i18next.t("response.noTracks"));
    return undefined;
  }
  return { ...track, artwork: getTrackCover(track) };
};

/** Get the names of the playlists that this track is in. */
export async function getTrackPlaylists(id: string) {
  const allTrackPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
  });
  return allTrackPlaylists.map((rel) => rel.playlistName);
}

/** Get multiple tracks. */
export async function getTracks(where: DrizzleFilter = []) {
  const allTracks = await db.query.tracks.findMany({
    where: and(...where),
    with: { album: true },
  });
  return allTracks.map((t) => ({ ...t, artwork: getTrackCover(t) }));
}
//#endregion

//#region POST Methods
/** Create a new track entry. */
export async function createTrack(entry: typeof tracks.$inferInsert) {
  return db.insert(tracks).values(entry).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of a track. */
export async function favoriteTrack(id: string, isFavorite: boolean) {
  return updateTrack(id, { isFavorite });
}

/** Update specified track. */
export async function updateTrack(
  id: string,
  values: Partial<typeof tracks.$inferInsert>,
) {
  return db.update(tracks).set(values).where(eq(tracks.id, id));
}
//#endregion

//#region PUT Methods
/** Add a track to a playlist. */
export async function addToPlaylist(
  entry: typeof tracksToPlaylists.$inferInsert,
) {
  return db.transaction(async (tx) => {
    // Get largest position value (which is the last track in the playlist).
    const lastTrack = await tx.query.tracksToPlaylists.findFirst({
      where: (fields, { eq }) => eq(fields.playlistName, entry.playlistName),
      orderBy: (fields, { desc }) => desc(fields.position),
    });
    // Add track to the end of the playlist (if we didn't provide a `position` value).
    const nextPos = (lastTrack?.position ?? -1) + 1;
    await tx
      .insert(tracksToPlaylists)
      .values({ position: nextPos, ...entry })
      .onConflictDoUpdate({
        target: [tracksToPlaylists.trackId, tracksToPlaylists.playlistName],
        set: { position: entry.position ?? nextPos },
      });
  });
}
//#endregion

//#region DELETE Methods
/** Delete specified track. */
export async function deleteTrack(id: string) {
  return db.transaction(async (tx) => {
    // Delete track and its playlist relations.
    await tx.delete(tracksToPlaylists).where(eq(tracksToPlaylists.trackId, id));
    await tx.delete(tracks).where(eq(tracks.id, id));
    const deletedTrack = await getTrack(id, false);
    // If the deletions were fine, delete the artwork.
    if (deletedTrack) await deleteImage(deletedTrack.artwork);
  });
}

/** Remove a track from a playlist. */
export async function removeFromPlaylist(
  entry: typeof tracksToPlaylists.$inferInsert,
) {
  return db
    .delete(tracksToPlaylists)
    .where(
      and(
        eq(tracksToPlaylists.trackId, entry.trackId),
        eq(tracksToPlaylists.playlistName, entry.playlistName),
      ),
    );
}

/** Delete any `TracksToPlaylists` entries where the `trackId` doesn't exist. */
export async function removeInvalidTrackRelations() {
  const [allTracks, trackRels] = await Promise.all([
    db.query.tracks.findMany({ columns: { id: true } }),
    db
      .selectDistinct({ id: tracksToPlaylists.trackId })
      .from(tracksToPlaylists),
  ]);
  try {
    const trackIds = new Set(allTracks.map((t) => t.id));
    const relTrackIds = trackRels.map((t) => t.id);
    // Get ids in the track to playlist relationship where the track id
    // doesn't exist and delete them.
    const invalidTracks = relTrackIds.filter((id) => !trackIds.has(id));
    if (invalidTracks.length > 0) {
      await db
        .delete(tracksToPlaylists)
        .where(inArray(tracksToPlaylists.trackId, invalidTracks));
    }
  } catch {}
}
//#endregion
