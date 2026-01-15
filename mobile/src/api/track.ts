import { and, eq, inArray } from "drizzle-orm";

import { db } from "~/db";
import type { Album, InvalidTrack, Track } from "~/db/schema";
import {
  invalidTracks,
  tracks,
  tracksToArtists,
  tracksToLyrics,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

import i18next from "~/modules/i18n";

import { getExcludedColumns, iAsc } from "~/lib/drizzle";
import type { BooleanPriority } from "~/utils/types";
import { getTrackArtwork } from "./track.utils";
import type { DrizzleFilter, QueriedTrack } from "./types";
import { getColumns, withRelations } from "./utils";

//#region GET Methods
/** Get specified track. Throws error if nothing is found. */
export async function getTrack<
  TCols extends keyof Track,
  ACols extends keyof Album,
  WithAlbum_User extends boolean | undefined,
>(
  id: string,
  options?: {
    columns?: TCols[];
    albumColumns?: [ACols, ...ACols[]];
    withAlbum?: WithAlbum_User;
  },
) {
  const track = await db.query.tracks.findFirst({
    where: eq(tracks.id, id),
    columns: getColumns(options?.columns),
    ...withRelations({ defaultWithAlbum: true, ...options }),
  });
  if (!track) throw new Error(i18next.t("err.msg.noTracks"));
  const hasArtwork =
    options?.columns === undefined ||
    options?.columns.includes("artwork" as TCols);
  return {
    ...track,
    ...(hasArtwork ? { artwork: getTrackArtwork(track) } : {}),
  } as QueriedTrack<BooleanPriority<WithAlbum_User, true>, TCols, ACols>;
}

/** Get the names of the playlists that this track is in. */
export async function getTrackPlaylists(id: string) {
  const allTrackPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: { playlistName: true },
  });
  return allTrackPlaylists.map(({ playlistName }) => playlistName);
}

/** Get multiple tracks. */
export async function getTracks<
  TCols extends keyof Track,
  ACols extends keyof Album,
  WithAlbum_User extends boolean | undefined,
>(options?: {
  where?: DrizzleFilter;
  columns?: TCols[];
  albumColumns?: [ACols, ...ACols[]];
  withAlbum?: WithAlbum_User;
}) {
  const allTracks = await db.query.tracks.findMany({
    where: and(...(options?.where ?? [])),
    columns: getColumns(options?.columns),
    ...withRelations({ defaultWithAlbum: true, ...options }),
    orderBy: (fields) => iAsc(fields.name),
  });
  const hasArtwork =
    options?.columns === undefined ||
    options?.columns.includes("artwork" as TCols);
  return allTracks.map((t) => {
    if (hasArtwork) t.artwork = getTrackArtwork(t);
    return t;
  }) as Array<
    QueriedTrack<BooleanPriority<WithAlbum_User, true>, TCols, ACols>
  >;
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

/** Create new track entries, or update existing ones. */
export function upsertTracks(entries: Array<typeof tracks.$inferInsert>) {
  return db.insert(tracks).values(entries).onConflictDoUpdate({
    target: tracks.id,
    set: UpsertFields,
  });
}
//#endregion

//#region DELETE Methods
type ErrorInfo = { errorName: string; errorMessage: string };

/** Delete track entries, with the option of also inserting them into the `InvalidTrack` schema. */
export async function deleteTracks(
  entries: Array<{ id: string; errorInfo?: ErrorInfo }>,
) {
  if (entries.length === 0) return;
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

    // Remove relations.
    await Promise.all(
      [tracksToArtists, tracksToLyrics, tracksToPlaylists, waveformSamples].map(
        (sch) => tx.delete(sch).where(inArray(sch.trackId, removedIds)),
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
//#endregion

//#region Internal Utils
const UpsertFields = getExcludedColumns([
  "name",
  "rawArtistName", // ! This field is deprecated.
  "albumId",
  "track",
  "disc",
  "year",
  "format",
  "bitrate",
  "sampleRate",
  "duration",
  "uri",
  "modificationTime",
  "fetchedArt",
  "size",
]);
//#endregion
