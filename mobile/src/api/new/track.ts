import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { tracks, tracksToPlaylists } from "@/db/schema";
import { getTrackCover } from "@/db/utils/formatters";

import i18next from "@/modules/i18n";

import { deleteFile } from "@/lib/file-system";
import type {
  DrizzleFilter,
  FavoriteArgs,
  QueryCondition,
  QueryMultiple,
  QuerySingleFn,
} from "./types";

//#region GET Methods
/** Get the specified track. Throws error by default if no track is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getTrack: QuerySingleFn<TrackWithAlbum> = async ({
  shouldThrow = true,
  ...opts
}) => {
  let conditions: DrizzleFilter = opts.filters ?? [];
  if (opts.id) conditions.push(eq(tracks.id, opts.id));
  const track = await db.query.tracks.findFirst({
    where: and(...conditions),
    with: { album: true },
  });
  if (!track) {
    if (shouldThrow) throw new Error(i18next.t("response.noTracks"));
    return undefined;
  }
  return { ...track, artwork: getTrackCover(track) };
};

/** Get the names of the playlists that this track is in. */
export async function getTrackPlaylists({ id }: { id: string }) {
  const allTrackPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: {},
    with: { playlist: { columns: { name: true } } },
  });
  return allTrackPlaylists.map(({ playlist }) => playlist.name);
}

/** Get multiple tracks. */
export async function getTracks(args?: QueryMultiple) {
  const allTracks = await db.query.tracks.findMany({
    where: and(...(args?.filters ?? [])),
    with: { album: true },
  });
  return allTracks.map((t) => ({ ...t, artwork: getTrackCover(t) }));
}
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of a track. */
export async function favoriteTrack({ isFavorite, ...args }: FavoriteArgs) {
  return updateTrack({ ...args, set: { isFavorite } });
}

/** Update specified track. */
export async function updateTrack(
  args: QueryCondition & { set: Partial<typeof tracks.$inferInsert> },
) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(tracks.id, args.id));
  return db
    .update(tracks)
    .set(args.set)
    .where(and(...conditions));
}
//#endregion

//#region PUT Methods
/** Add a track to a playlist. */
export async function addToPlaylist(args: {
  id: string;
  playlistName: string;
}) {
  return db
    .insert(tracksToPlaylists)
    .values({ trackId: args.id, playlistName: args.playlistName })
    .onConflictDoNothing();
}
//#endregion

//#region DELETE Methods
/** Delete specified track. */
export async function deleteTrack(args: QueryCondition) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(tracks.id, args.id));
  return db.transaction(async (tx) => {
    const trackToDelete = await getTracks({ filters: conditions });
    // Delete each track and its relations.
    for (const track of trackToDelete) {
      await tx
        .delete(tracksToPlaylists)
        .where(eq(tracksToPlaylists.trackId, track.id));
      await tx.delete(tracks).where(eq(tracks.id, track.id));
    }
    // If the deletions were fine, delete the artworks.
    for (const { artwork } of trackToDelete) {
      await deleteFile(artwork);
    }
  });
}

/** Remove a track from a playlist. */
export async function removeFromPlaylist(args: {
  id: string;
  playlistName: string;
}) {
  return db
    .delete(tracksToPlaylists)
    .where(
      and(
        eq(tracksToPlaylists.trackId, args.id),
        eq(tracksToPlaylists.playlistName, args.playlistName),
      ),
    );
}
//#endregion
