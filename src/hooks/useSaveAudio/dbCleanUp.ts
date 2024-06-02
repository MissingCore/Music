import { eq } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, albums, invalidTracks } from "@/db/schema";
import { deleteTrack } from "@/db/queries";

import {
  resetPlayingInfoAtom,
  trackListAsyncAtom,
} from "@/features/playback/api/track";
import { queueRemoveItemsAtom } from "@/features/playback/api/queue";

import { deleteFile } from "@/lib/file-system";

/**
 * @description Remove any tracks in our database that we didn't find w/
 *  Expo Media Library. Will then delete any unused artists & albums.
 */
export async function dbCleanUp(usedTrackIds: Set<string>) {
  const jotaiStore = getDefaultStore();

  // Delete track entries.
  const allTracks = await db.query.tracks.findMany({ columns: { id: true } });
  const allInvalidTracks = await db.query.invalidTracks.findMany({
    columns: { id: true },
  });
  const tracksToDelete = [
    ...allTracks.map(({ id }) => id),
    ...allInvalidTracks.map(({ id }) => id),
  ].filter((id) => !usedTrackIds.has(id));
  await Promise.allSettled(
    tracksToDelete.map(async (id) => {
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      await deleteTrack(id);
    }),
  );

  // Clear current track list if it contains a track that's deleted. This
  // prevents any broken behavior if the `TrackListSource` no longer exists
  // (ie: the track deleted was the only track in the album which been
  // deleted).
  const deletedTrackInCurrTrackList = (
    await jotaiStore.get(trackListAsyncAtom)
  ).data.some((tId) => tracksToDelete.includes(tId));
  if (deletedTrackInCurrTrackList) jotaiStore.set(resetPlayingInfoAtom);
  // Clear the queue of deleted tracks.
  jotaiStore.set(queueRemoveItemsAtom, tracksToDelete);

  // Remove albums with no tracks.
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true, artwork: true },
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allAlbums
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ id, artwork }) => {
        await deleteFile(artwork);
        await db.delete(albums).where(eq(albums.id, id));
      }),
  );

  // Remove Artists with no tracks.
  const allArtists = await db.query.artists.findMany({
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allArtists
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ name }) => {
        await db.delete(artists).where(eq(artists.name, name));
      }),
  );
}
