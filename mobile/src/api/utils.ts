import type { asc, desc, sql } from "drizzle-orm";

import type { Track } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";

/** Get columns we want to select in the database schema. */
export function getColumns(keys?: string[]) {
  if (keys === undefined) return undefined;
  return Object.fromEntries(keys.map((key) => [key, true]));
}

type WithTracksOptions = {
  withTracks?: false;
  trackColumns?: string[];
  /** Use the typical "orderBy" structure since typing is hard. */
  orderBy?: (
    fields: Record<keyof Track, any>,
    orderOperators: { sql: typeof sql; asc: typeof asc; desc: typeof desc },
  ) => any | any[];
};

/**
 * Determines if the `tracks` relation is used along with each track's
 * `album` relation.
 *
 * **Note:** The typing is very loose as to support the various use case of
 * `QueryOneWithTracksFn` (we ensure what's returned complies with what's
 * expected).
 */
export function withTracks(
  trackOptions: WithTracksOptions,
  albumOptions: WithAlbumOptions,
) {
  // FIXME: Would like better & safer typing.
  return (trackOptions.withTracks !== false
    ? {
        tracks: {
          columns: getColumns(trackOptions?.trackColumns),
          orderBy: trackOptions.orderBy,
          ...withRelations(albumOptions),
        },
      }
    : {}) as unknown as {
    tracks: { with: { album: true; tracksToArtists: true } };
  };
}

type WithAlbumOptions = {
  defaultWithAlbum: boolean;
  withAlbum?: boolean;
  albumColumns?: string[];
};

/**
 * Creates the relations through the `with` operator for the `tracks`
 * field.
 *
 * **Note:** The typing is very loose as to support the various use case of
 * `QueryOneWithTracksFn` (we ensure what's returned complies with what's
 * expected).
 */
export function withRelations(options: WithAlbumOptions) {
  return {
    with: {
      ...((options.withAlbum ?? options.defaultWithAlbum) === true
        ? { album: { columns: getColumns(options.albumColumns) } }
        : {}),
      tracksToArtists: {
        // @ts-expect-error - Valid syntax.
        orderBy: (fields) => iAsc(fields.artistName),
        columns: { artistName: true },
      },
    },
  } as unknown as { with: { album: true; tracksToArtists: true } };
}
