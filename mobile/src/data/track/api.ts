import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import { tracks, tracksToPlaylists } from "~/db/schema";

import { getExcludedColumns, iDesc } from "~/lib/drizzle";

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
