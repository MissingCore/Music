import { getAudioMetadata } from "@missingcore/audio-metadata";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

import { saveBase64Img } from "@/lib/file-system";
import { queryClient } from "@/lib/react-query";

/** @description Make sure we run the logic to save cover images once. */
export const saveCoverImagesOnce = (() => {
  let executed = false;
  return async () => {
    if (!executed) {
      executed = true;
      await saveCoverImages();
    }
  };
})();

/**
 * @description Optimizes saving cover images of tracks & albums. Recommended
 *  to be run in the background by not calling this function with `await`.
 *  - Do note the possibility of having "floating" images if we close the
 *  application before referencing the image path in our database.
 */
export async function saveCoverImages() {
  const start = performance.now();

  const uncheckedTracks = await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.fetchedArt, false),
    columns: { id: true, albumId: true, uri: true },
  });
  const _albumsWCovers = await db.query.albums.findMany({
    where: (fields, { isNotNull }) => isNotNull(fields.artwork),
    columns: { id: true },
  });
  const albumsWCovers = new Set(_albumsWCovers.map(({ id }) => id));

  let newCoverImgCnt = 0;

  for (const { id, albumId, uri } of uncheckedTracks) {
    // If we don't have an `albumId` or if the album doesn't have a cover image.
    if (!albumId || !albumsWCovers.has(albumId)) {
      const { metadata } = await getAudioMetadata(uri, ["artwork"]);
      if (metadata.artwork) {
        // Very slim chance that we might have a "floating" image if we
        // close the app right after saving the image, but before setting
        // `fetchedArt` to `true`.
        const artwork = await saveBase64Img(metadata.artwork);
        if (albumId) {
          await db
            .update(albums)
            .set({ artwork })
            .where(eq(albums.id, albumId));
          albumsWCovers.add(albumId);
        } else {
          await db.update(tracks).set({ artwork }).where(eq(tracks.id, id));
        }
        newCoverImgCnt++;
      }
    }

    // Regardless, we set `fetchedArt` to `true.
    await db.update(tracks).set({ fetchedArt: true }).where(eq(tracks.id, id));
  }

  console.log(
    `Finished saving ${newCoverImgCnt} new cover images in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
  );

  // Invalidate all queries (exclude "Latest Release" query) if we saved
  // a cover image.
  if (newCoverImgCnt > 0) {
    queryClient.invalidateQueries({
      // @ts-expect-error ts(2339) — We normalized the `queryKey` structure
      // to be an object with an `entity` key.
      predicate: ({ queryKey }) => queryKey[0]?.entity !== "releases",
    });
  }
}
