import { eq } from "drizzle-orm";

import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

import { saveBase64Img } from "@/lib/file-system";
import { getMusicInfoAsync } from "@/utils/getMusicInfoAsync";

/**
 * @description Optimizes saving cover images of tracks & albums. Recommended
 *  to be run in the background by not calling this function with `await`.
 *  - Do note the possibility of having "floating" images if we close the
 *  application before referencing the image path in our database.
 */
export async function saveCoverImages() {
  const start = Date.now();

  const uncheckedTracks = await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.fetchedCover, false),
    columns: { id: true, albumId: true, uri: true },
  });
  const _albumsWCovers = await db.query.albums.findMany({
    where: (fields, { isNotNull }) => isNotNull(fields.coverSrc),
    columns: { id: true },
  });
  const albumsWCovers = new Set(_albumsWCovers.map(({ id }) => id));

  let newCoverImgCnt = 0;

  for (const { id, albumId, uri } of uncheckedTracks) {
    // If we don't have an `albumId` or if the album doesn't have a cover image.
    if (!albumId || !albumsWCovers.has(albumId)) {
      const { cover } = await getMusicInfoAsync(uri, false);
      if (cover) {
        // Very slim chance that we might have a "floating" image if we
        // close the app right after saving the image, but before setting
        // `fetchedCover` to `true`.
        const coverSrc = await saveBase64Img(cover);
        if (albumId) {
          await db
            .update(albums)
            .set({ coverSrc })
            .where(eq(albums.id, albumId));
          albumsWCovers.add(albumId);
        } else {
          await db.update(tracks).set({ coverSrc }).where(eq(tracks.id, id));
        }
        newCoverImgCnt++;
      }
    }

    // Regardless, we set `fetchedCover` to `true.
    await db
      .update(tracks)
      .set({ fetchedCover: true })
      .where(eq(tracks.id, id));
  }

  console.log(
    `Finished indexing ${newCoverImgCnt} new cover images in ${(Date.now() - start) / 1000}s.`,
  );
}
