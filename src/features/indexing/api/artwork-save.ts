import { getAudioMetadata } from "@missingcore/audio-metadata";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

import { saveBase64Img } from "@/lib/file-system";
import { clearAllQueries } from "@/lib/react-query";
import { Stopwatch } from "@/utils/debug";

/** @description Make sure we run the logic to save artwork once. */
export const saveArtworkOnce = (() => {
  let executed = false;
  return async () => {
    if (!executed) {
      executed = true;
      await saveArtwork();
    }
  };
})();

/** @description Save artwork for albums & tracks in an optimized manner. */
export async function saveArtwork() {
  const stopwatch = new Stopwatch();

  const uncheckedTracks = await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.fetchedArt, false),
    columns: { id: true, albumId: true, uri: true, name: true, artwork: true },
  });
  const albumsWithCovers = new Set(
    (
      await db.query.albums.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.artwork),
        columns: { id: true },
      })
    ).map(({ id }) => id),
  );

  let newArtworkCount = 0;

  for (const { id, albumId, uri, name, artwork } of uncheckedTracks) {
    // Make sure the track doesn't have `artwork` and either be unassociated
    // with an album or its album doesn't have `artwork`.
    if (!artwork && (!albumId || !albumsWithCovers.has(albumId))) {
      const { metadata } = await getAudioMetadata(uri, ["artwork"]);
      if (metadata.artwork) {
        try {
          const artwork = await saveBase64Img(metadata.artwork);
          if (albumId) {
            await db
              .update(albums)
              .set({ artwork })
              .where(eq(albums.id, albumId));
            albumsWithCovers.add(albumId);
          } else {
            await db.update(tracks).set({ artwork }).where(eq(tracks.id, id));
          }
          newArtworkCount++;
        } catch (err) {
          // In case we fail to save an image due to having an invalid base64 string.
          console.log(`[Error] Failed to save image for "${name}".`);
        }
      }
    }

    // Indicate we attempted to find artwork for a track.
    await db.update(tracks).set({ fetchedArt: true }).where(eq(tracks.id, id));
  }

  console.log(
    `Finished saving ${newArtworkCount} new cover images in ${stopwatch.lapTime()}.`,
  );

  if (newArtworkCount > 0) clearAllQueries();
}
