import { eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import type { Maybe } from "~/utils/types";
import type { FolderTrack } from "./types";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

//#region GET Methods
/**
 * Return the tracks associated with a folder directory. It's not guaranteed
 * that the folder exists.
 */
export async function getFolderTracks<TOnlyIds extends boolean = false>(
  path: Maybe<string>,
  onlyIds?: TOnlyIds,
) {
  if (!path) {
    return [] as unknown as TOnlyIds extends true
      ? Array<{ id: string }>
      : FolderTrack[];
  }

  const orderedTrackArtists = getOrderedTrackArtistsView();

  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`.as(
              "derived_artwork",
            ),
            duration: tracks.duration,
            album: albums.name,
            /** We need to unencode these fields. */
            artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
          },
    )
    .from(tracks)
    .where(eq(tracks.parentFolder, `file:///${addTrailingSlash(path)}`))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracks.id)
    .orderBy(iAsc(tracks.name));

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: unencodeJSONArray(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : FolderTrack[];
}
//#endregion
