import { eq } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, albums, invalidTracks, tracks } from "@/db/schema";
import { deleteTrack } from "@/db/queries";

import {
  Queue,
  RecentList,
  _playListAtom,
  resetPersistentMediaAtom,
} from "@/modules/media/services/Persistent";

import { clearAllQueries } from "@/lib/react-query";
import { batch } from "@/utils/promise";

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
  await batch({
    data: missingTrackIds,
    callback: async (id) => {
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      await deleteTrack(id);
    },
  });

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
  const hasRemovedTrack = (await jotaiStore.get(_playListAtom)).some((tId) =>
    removedTracks.includes(tId),
  );
  if (hasRemovedTrack) await jotaiStore.set(resetPersistentMediaAtom);
  // Clear the queue of deleted tracks.
  await Queue.removeIds(removedTracks);
}

/** Remove from the database any albums that have no tracks. */
export async function removeUnlinkedAlbums() {
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true },
    with: { tracks: { columns: { id: true } } },
  });
  const albumsToRemove = allAlbums.filter(({ tracks }) => tracks.length === 0);
  await Promise.allSettled(
    albumsToRemove.map(({ id }) => db.delete(albums).where(eq(albums.id, id))),
  );
  if (albumsToRemove.length > 0) {
    await RecentList.removeEntries(
      albumsToRemove.map(({ id }) => ({ type: "album", id })),
    );
  }
}

/** Remove from the database any artists that have no tracks or albums. */
export async function removeUnlinkedArtists() {
  const allArtists = await db.query.artists.findMany({
    with: {
      albums: { columns: { id: true } },
      tracks: { columns: { id: true } },
    },
  });
  const artistsToRemove = allArtists.filter(
    ({ albums, tracks }) => albums.length === 0 && tracks.length === 0,
  );
  await Promise.allSettled(
    artistsToRemove.map(({ name }) =>
      db.delete(artists).where(eq(artists.name, name)),
    ),
  );
  if (artistsToRemove.length > 0) {
    await RecentList.removeEntries(
      artistsToRemove.map(({ name }) => ({ type: "artist", id: name })),
    );
  }
}
