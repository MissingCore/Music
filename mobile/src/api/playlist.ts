import { and } from "drizzle-orm";

import { db } from "~/db";
import type {
  Playlist,
  PlaylistWithJunction,
  PlaylistWithTracks,
} from "~/db/schema";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn } from "./types";
import { getColumns, withRelations } from "./utils";

//#region GET Methods
const _getPlaylists: QueryManyWithTracksFn<Playlist> =
  () => async (options) => {
    const allPlaylists = await db.query.playlists.findMany({
      where: and(...(options?.where ?? [])),
      columns: getColumns(options?.columns),
      with: {
        // Note: `where` only works on the 1st "with" block.
        tracksToPlaylists: {
          columns: {},
          with: {
            track: {
              columns: getColumns(options?.trackColumns),
              ...withRelations({ defaultWithAlbum: true, ...options }),
            },
          },
          orderBy: (fields, { asc }) => asc(fields.position),
        },
      },
      orderBy: (fields) => iAsc(fields.name),
    });
    return allPlaylists.map((data) => fixPlaylistJunction(data));
  };

/**
 * Get multiple playlists.
 *
 * **Note:** Do not use the `withTracks` option with this function.
 */
export const getPlaylists = _getPlaylists();
//#endregion

//#region Internal Utils
/** Replace the "junction" field from the `Playlist` table with `tracks`. */
function fixPlaylistJunction(data: PlaylistWithJunction): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return {
    ...rest,
    // Note: We do the filter in the case where we attempted to delete a track,
    // but failed to do so (resulting in an invalid track floating around).
    tracks: tracksToPlaylists
      .map(({ track }) => track)
      .filter((t) => t !== null),
  };
}
//#endregion
