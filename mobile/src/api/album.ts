import { and } from "drizzle-orm";

import { db } from "~/db";
import type { Album } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn } from "./types";
import { getColumns, withTracks } from "./utils";

//#region GET Methods
const _getAlbums: QueryManyWithTracksFn<Album, false> =
  () => async (options) => {
    return db.query.albums.findMany({
      where: and(...(options?.where ?? [])),
      columns: getColumns(options?.columns),
      with: withTracks(
        {
          ...options,
          orderBy: (fields, { asc }) => [asc(fields.disc), asc(fields.track)],
        },
        { defaultWithAlbum: false, ...options },
      ),
      orderBy: (fields) => [iAsc(fields.name), iAsc(fields.artistsKey)],
    });
  };

/** Get multiple albums. */
export const getAlbums = _getAlbums();
//#endregion
