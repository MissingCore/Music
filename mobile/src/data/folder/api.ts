import { and, eq, exists, isNull, like, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, fileNodes, tracks } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import type { Maybe } from "~/utils/types";
import type { FolderTrack } from "./types";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

//#region GET Methods
/** Get all data associated with a folder. `path` doesn't include `file:///`. */
export async function getFolder<TOnlyIds extends boolean = false>(
  path: Maybe<string>,
  onlyIds?: TOnlyIds,
) {
  const [folderDirectories, folderTracks] = await Promise.all([
    getFolderDirectories(path),
    getFolderTracks(path, onlyIds),
  ]);

  return { directories: folderDirectories, tracks: folderTracks };
}

/**
 * Return the directories associated with a folder directory. It's not
 * guaranteed that the folder exists.
 */
export async function getFolderDirectories(path: Maybe<string>) {
  const directories = await db
    .select()
    .from(fileNodes)
    .where(
      and(
        path
          ? eq(fileNodes.parentPath, addTrailingSlash(path))
          : isNull(fileNodes.parentPath),
        exists(
          db
            .select({ id: tracks.id })
            .from(tracks)
            .where(
              like(
                tracks.uri,
                sql<string>`CONCAT('file:///', ${fileNodes.path}, '%')`,
              ),
            )
            .limit(1),
        ),
      ),
    )
    .orderBy(iAsc(fileNodes.name));

  return directories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      // So folder order is: "1-10", "11-20" instead of: "1-10", "101-110".
      numeric: true,
      caseFirst: "upper",
    }),
  );
}

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
