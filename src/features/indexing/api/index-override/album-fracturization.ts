import { getAudioMetadata } from "@missingcore/audio-metadata";
import { inArray } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { createAlbum } from "@/db/queries";
import { resetPlayingInfoAtom } from "@/features/playback/api/track";

import { getAlbumKey } from "../index-audio";

/**
 * Fixes any fracturized albums by combining them together if they share
 * the same album artist.
 *
 * **NOTE:** Doesn't work as expected if you only have one of the tracks in
 * a "collaboration" album.
 *
 * To fix this in the future if `fixAlbumFracturization()` isn't run, first
 * "delete" the track temporarily. Then open the app to have the database
 * update & remove this track. Finally, "restore" the deleted track.
 */
export async function fixAlbumFracturization() {
  const allAlbums = await db.query.albums.findMany({
    with: { tracks: { columns: { uri: true } } },
  });

  // Get the album names that are repeated in the database.
  const duplicateAlbumNames = Object.entries(
    allAlbums.reduce<Record<string, number>>((accum, { name }) => {
      accum[name] = (accum[name] ?? 0) + 1;
      return accum;
    }, {}),
  )
    .filter(([_, count]) => count > 1)
    .map(([name]) => name);

  // Check to see if duplicate album names have the same `albumArtist`.
  for (const albumName of duplicateAlbumNames) {
    // This should be a relatively small list (there are usually at most
    // ~10-12 tracks per album).
    const usedAlbums = allAlbums.filter(({ name }) => name === albumName);

    // Help determine which albums need to be fixed/replaced by getting
    // the current "albumKey" value.
    const albumInfoMap: Record<
      string,
      {
        albumIds: string[];
        entry: { name: string; artistName: string; releaseYear?: number };
      }
    > = {};
    await Promise.all(
      usedAlbums.map(async ({ id, tracks }) => {
        const {
          metadata: { album, albumArtist: aA, year },
        } = await getAudioMetadata(tracks[0]!.uri, [
          ...["album", "albumArtist", "artist", "year"],
        ] as const);

        const key = getAlbumKey({ album, albumArtist: aA, year });
        if (albumInfoMap[key]) {
          albumInfoMap[key].albumIds.push(id);
        } else {
          albumInfoMap[key] = {
            albumIds: [id],
            entry: { name: album!, artistName: aA!, releaseYear: year },
          };
        }
      }),
    );

    // Get the keys that were repeated multiple times.
    const duplicatedAlbumKeys = Object.entries(albumInfoMap)
      .filter(([_, { albumIds }]) => albumIds.length > 1)
      .map(([key]) => key);

    // Create new album entry for the duplicated albums.
    await Promise.allSettled(
      duplicatedAlbumKeys.map(async (key) => {
        const { albumIds, entry } = albumInfoMap[key]!;
        // Make sure `albumArtist` exists as an `Artist`.
        await db
          .insert(artists)
          .values({ name: entry.artistName })
          .onConflictDoNothing();
        // Create new album & replace the ids of album names that are
        // "duplicated" with the new id.
        await db
          .update(tracks)
          .set({ albumId: (await createAlbum(entry)).id })
          .where(inArray(tracks.albumId, albumIds));
      }),
    );

    // Reset playing info in case we're playing a deleted album.
    getDefaultStore().set(resetPlayingInfoAtom);
  }
}
