import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "~/db";
import type { Album, Track } from "~/db/schema";
import { invalidTracks, tracks, tracksToPlaylists } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

import i18next from "~/modules/i18n";

import { getExcludedColumns, iAsc } from "~/lib/drizzle";
import type { BooleanPriority } from "~/utils/types";
import type { DrizzleFilter, QueriedTrack } from "./types";
import { getColumns, withAlbum } from "./utils";

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
    ...withAlbum({ defaultWithAlbum: true, ...options }),
  });
  if (!track) throw new Error(i18next.t("err.msg.noTracks"));
  const hasArtwork =
    options?.columns === undefined ||
    options?.columns.includes("artwork" as TCols);
  return {
    ...track,
    ...(hasArtwork ? { artwork: getTrackCover(track) } : {}),
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
  withHidden?: boolean;
}) {
  const allTracks = await db.query.tracks.findMany({
    where: and(
      ...(options?.where ??
        (!options?.withHidden ? [isNull(tracks.hiddenAt)] : [])),
    ),
    columns: getColumns(options?.columns),
    ...withAlbum({ defaultWithAlbum: true, ...options }),
    orderBy: (fields) => iAsc(fields.name),
  });
  const hasArtwork =
    options?.columns === undefined ||
    options?.columns.includes("artwork" as TCols);
  return allTracks.map((t) => {
    if (hasArtwork) t.artwork = getTrackCover(t);
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
/** Delete specified track. */
export async function deleteTrack(
  id: string,
  errorInfo?: { errorName: string; errorMessage: string },
) {
  return db.transaction(async (tx) => {
    // Remember to delete the track's playlist relations.
    await tx.delete(tracksToPlaylists).where(eq(tracksToPlaylists.trackId, id));
    const [deletedTrack] = await tx
      .delete(tracks)
      .where(eq(tracks.id, id))
      .returning();
    // Add to `InvalidTrack` schema if we provided the error.
    if (deletedTrack && errorInfo) {
      const { id, uri, modificationTime } = deletedTrack;
      await db
        .insert(invalidTracks)
        .values({ id, uri, modificationTime, ...errorInfo })
        .onConflictDoUpdate({
          target: invalidTracks.id,
          set: { modificationTime, ...errorInfo },
        });
    }
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

//#region Internal Utils
const UpsertFields = getExcludedColumns([
  "name",
  "artistName",
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
