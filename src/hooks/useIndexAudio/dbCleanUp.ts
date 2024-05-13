import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  artists,
  albums,
  invalidTracks,
  tracks,
  tracksToPlaylists,
} from "@/db/schema";

import { deleteFile } from "@/lib/file-system";

/**
 * @description Remove any tracks in our database that we didn't find w/
 *  Expo Media Library. Will then delete any unused artists & albums.
 */
export async function dbCleanUp(
  usedTrackIds: Set<string>,
  currTrackList: string[],
  resetPlayingInfo: () => void,
  removeTracksFromQueue: (tracks: string[]) => void,
) {
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
      await db
        .delete(tracksToPlaylists)
        .where(eq(tracksToPlaylists.trackId, id));
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      const [deletedTrack] = await db
        .delete(tracks)
        .where(eq(tracks.id, id))
        .returning({ artwork: tracks.artwork });
      await deleteFile(deletedTrack.artwork);
    }),
  );

  // Clear current track list if it contains a track that's deleted. This
  // prevents any broken behavior if the `TrackListSource` no longer exists
  // (ie: the track deleted was the only track in the album which been
  // deleted).
  const deletedTrackInCurrTrackList = currTrackList.some((tId) =>
    tracksToDelete.includes(tId),
  );
  if (deletedTrackInCurrTrackList) resetPlayingInfo();
  // Clear the queue of deleted tracks.
  removeTracksFromQueue(tracksToDelete);

  // Remove Albums with no tracks.
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
