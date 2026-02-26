import { and, eq, inArray } from "drizzle-orm";

import { db } from "~/db";
import type { InvalidTrack } from "~/db/schema";
import { invalidTracks, tracks, tracksToPlaylists } from "~/db/schema";

import { getExcludedColumns, iDesc } from "~/lib/drizzle";
import { TrackRelationTables } from "./constants";

type InsertedTrack = typeof tracks.$inferInsert;
type InsertedTrackPlaylistRelation = typeof tracksToPlaylists.$inferInsert;

//#region PATCH Methods
export async function updateTrack(
  id: string,
  values: Partial<Omit<InsertedTrack, "id">>,
) {
  return db.update(tracks).set(values).where(eq(tracks.id, id));
}
//#endregion

//#region PUT Methods
export function toggleTrackInPlaylist(entry: InsertedTrackPlaylistRelation) {
  return db.transaction(async (tx) => {
    const condition = and(
      eq(tracksToPlaylists.playlistName, entry.playlistName),
      eq(tracksToPlaylists.trackId, entry.trackId),
    );

    if (await tx.query.tracksToPlaylists.findFirst({ where: condition })) {
      await tx.delete(tracksToPlaylists).where(condition);
    } else {
      // Figure out last position in playlist.
      const lastTrack = await tx.query.tracksToPlaylists.findFirst({
        where: eq(tracksToPlaylists.playlistName, entry.playlistName),
        orderBy: iDesc(tracksToPlaylists.position),
      });
      const position = (lastTrack?.position ?? -1) + 1;
      // No conflict check as the track shouldn't exist in the playlist.
      await tx.insert(tracksToPlaylists).values({ ...entry, position });
    }
  });
}

/** Create/update track entries. */
export function upsertTracks(entries: InsertedTrack[]) {
  return db.insert(tracks).values(entries).onConflictDoUpdate({
    target: tracks.id,
    set: UpsertFields,
  });
}
//#endregion

//#region DELETE Methods
type ErrorInfo = { errorName: string; errorMessage: string };

/** Delete track entries, with the option of inserting them into the `InvalidTrack` schema. */
export async function deleteTracks(
  entries: Array<{ id: string; errorInfo?: ErrorInfo }>,
) {
  return db.transaction(async (tx) => {
    const removedIds: string[] = [];
    const erroredIds = new Set<string>();
    const errorInfoMap: Record<string, ErrorInfo> = {};
    for (const { id, errorInfo } of entries) {
      removedIds.push(id);
      if (errorInfo) {
        erroredIds.add(id);
        errorInfoMap[id] = errorInfo;
      }
    }

    // Remove relations
    await Promise.all(
      TrackRelationTables.map((sch) =>
        tx.delete(sch).where(inArray(sch.trackId, removedIds)),
      ),
    );

    const deletedTracks = await tx
      .delete(tracks)
      .where(inArray(tracks.id, removedIds))
      .returning({
        id: tracks.id,
        uri: tracks.uri,
        modificationTime: tracks.modificationTime,
      });

    // Exit early if we don't need to add entries to the `InvalidTrack` schema.
    if (erroredIds.size === 0 || deletedTracks.length === 0) return;

    const invalidTracksEntries: InvalidTrack[] = [];
    for (const deletedTrack of deletedTracks) {
      if (!erroredIds.has(deletedTrack.id)) continue;
      const errorInfo = errorInfoMap[deletedTrack.id];
      if (!errorInfo) continue;
      invalidTracksEntries.push({ ...deletedTrack, ...errorInfo });
    }

    if (invalidTracksEntries.length === 0) return;
    // Insert into `InvalidTrack` schema.
    await tx
      .insert(invalidTracks)
      .values(invalidTracksEntries)
      .onConflictDoUpdate({
        target: invalidTracks.id,
        // Replace existing fields with new values.
        set: getExcludedColumns([
          "modificationTime",
          "errorName",
          "errorMessage",
        ]),
      });
  });
}
//#endregion

//#region Internal Utils
const UpsertFields = getExcludedColumns([
  "name",
  "rawArtistName", // ! This field is deprecated.
  "albumId",
  "disc",
  "track",
  "year",
  "duration",
  "format",
  "bitrate",
  "sampleRate",
  "uri",
  "modificationTime",
  "fetchedArt",
  "size",
]);
//#endregion
