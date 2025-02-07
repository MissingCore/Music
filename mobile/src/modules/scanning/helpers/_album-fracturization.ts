import { inArray, isNull } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks } from "~/db/schema";

import { getAlbums } from "~/api/album";

import { musicStore } from "~/modules/media/services/Music";

type UniqueFields = { name: string; artistName: string };

/**
 * Fix album fracturization caused by having `null` in the `releaseYear`
 * field as in SQL, `null !== null`.
 */
export async function fixAlbumFracturization() {
  const nullYearAlbums = await getAlbums({
    where: [isNull(albums.releaseYear)],
    columns: ["id", "name", "artistName"],
    withTracks: false,
  });

  // Find which `name` + `artistName` combinations have been duplicated
  // with `releaseYear = null`.
  let duplicateCombos: Array<{ key: UniqueFields; ids: string[] }> = [];
  nullYearAlbums.forEach((al, idx) => {
    // See if we found this album earlier.
    const existsIdx = duplicateCombos.findIndex((dupAl) =>
      doesAlbumCopyExists(al, dupAl.key),
    );
    if (existsIdx !== -1) {
      duplicateCombos[existsIdx]?.ids.push(al.id);
      return;
    }
    // Don't need to check last index for duplicate.
    if (idx === nullYearAlbums.length - 1) return;
    // See if this album appears again later on.
    const exists = [...nullYearAlbums]
      .slice(idx + 1)
      .some((al2) => doesAlbumCopyExists(al, al2));
    if (exists) {
      duplicateCombos.push({
        key: { name: al.name, artistName: al.artistName },
        ids: [al.id],
      });
    }
  });

  // Replace ids of tracks.
  await Promise.allSettled(
    duplicateCombos.map(async ({ ids }) => {
      const [to, ...from] = ids;
      if (!to) return;
      await db.transaction(async (tx) => {
        await tx
          .update(tracks)
          .set({ albumId: to })
          .where(inArray(tracks.albumId, from));
        // Delete replaced albums.
        await tx.delete(albums).where(inArray(albums.id, from));
      });
    }),
  );

  // Ensure `releaseYear` is `-1` if `null`.
  await db
    .update(albums)
    .set({ releaseYear: -1 })
    .where(isNull(albums.releaseYear));

  // Clear playback store in case the album that got fixed was being played.
  await musicStore.getState().reset();
}

function doesAlbumCopyExists(album1: UniqueFields, album2: UniqueFields) {
  return album1.name === album2.name && album1.artistName === album2.artistName;
}
