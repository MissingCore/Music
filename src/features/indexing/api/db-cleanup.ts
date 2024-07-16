import { eq } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, albums, invalidTracks, tracks } from "@/db/schema";
import { deleteTrack } from "@/db/queries";

import {
  resetPlayingInfoAtom,
  trackListAsyncAtom,
} from "@/features/playback/api/track";
import { queueRemoveItemsAtom } from "@/features/playback/api/queue";

import { clearAllQueries } from "@/lib/react-query";

/** Clean up any unlinked content in the database. */
export async function cleanUpDb(usedTrackIds: Set<string>) {
  const deletedTracksCount = await removeUnlinkedTracks(usedTrackIds);
  await removeUnlinkedAlbums();
  await removeUnlinkedArtists();

  if (deletedTracksCount > 0) clearAllQueries();
}

/**
 * Remove from the database any tracks that we've haven't found through
 * `expo-media-library`.
 */
export async function removeUnlinkedTracks(foundTracks: Set<string>) {
  // Get the ids of the tracks we can delete.
  const missingTrackIds = (
    await Promise.all(
      [invalidTracks, tracks].map((sch) => db.select({ id: sch.id }).from(sch)),
    )
  )
    .flat()
    .map(({ id }) => id)
    .filter((id) => !foundTracks.has(id));

  // Delete missing tracks.
  await Promise.allSettled(
    missingTrackIds.map(async (id) => {
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      await deleteTrack(id);
    }),
  );

  await revalidatePlaybackStore(missingTrackIds);

  return missingTrackIds.length;
}

/**
 * Ensure we don't have any reference to the deleted track in the playback
 * store.
 */
export async function revalidatePlaybackStore(removedTracks: string[]) {
  const jotaiStore = getDefaultStore();
  // See if the current playing tracklist contains a deleted track.
  const hasRemovedTrack = (await jotaiStore.get(trackListAsyncAtom)).data.some(
    (tId) => removedTracks.includes(tId),
  );
  if (hasRemovedTrack) jotaiStore.set(resetPlayingInfoAtom);
  // Clear the queue of deleted tracks.
  jotaiStore.set(queueRemoveItemsAtom, removedTracks);
}

/** Remove from the database any albums that have no tracks. */
export async function removeUnlinkedAlbums() {
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true },
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allAlbums
      .filter(({ tracks }) => tracks.length === 0)
      .map(({ id }) => db.delete(albums).where(eq(albums.id, id))),
  );
}

/** Remove from the database any artists that have no tracks or albums. */
export async function removeUnlinkedArtists() {
  const allArtists = await db.query.artists.findMany({
    with: {
      albums: { columns: { id: true } },
      tracks: { columns: { id: true } },
    },
  });
  await Promise.allSettled(
    allArtists
      .filter(
        ({ albums, tracks }) => albums.length === 0 && tracks.length === 0,
      )
      .map(({ name }) => db.delete(artists).where(eq(artists.name, name))),
  );
}
