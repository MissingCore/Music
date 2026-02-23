import { count, eq, getTableColumns, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks } from "~/db/schema";

// FIXME: Want to eventually move to `~/data/albums/utils.ts`.
import { AlbumArtistsKey } from "~/api/album.utils";

import { iAsc } from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";

const albumFields = omitKeys(getTableColumns(albums), [
  "altArtwork",
  "embeddedArtwork",
]);

//#region GET Methods
/** Get information summarizing each album (sorted by names). */
export async function getAlbumsSummary() {
  const results = await db
    .select({
      ...albumFields,
      duration: sum(tracks.duration),
      trackCount: count(tracks.id),
    })
    .from(albums)
    .innerJoin(tracks, eq(albums.id, tracks.albumId))
    .groupBy(albums.name)
    .orderBy(iAsc(albums.name), iAsc(albums.artistsKey));

  return results
    .filter(({ trackCount }) => trackCount > 0)
    .map(({ artistsKey, ...album }) => ({
      ...album,
      artistName: AlbumArtistsKey.toString(artistsKey),
      duration: Number(album.duration) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion
