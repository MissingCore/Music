import { inArray, isNotNull, lt } from "drizzle-orm";
import { Directory } from "expo-file-system";

import { db } from "~/db";
import {
  albums,
  albumsToArtists,
  artists,
  hiddenTracks,
  invalidTracks,
  playedMediaLists,
  playlists,
  tracks,
  tracksToArtists,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

import { RECENT_RANGE_MS } from "~/api/recent";
import { Queue } from "~/stores/Playback/actions";

import { ImageDirectory, deleteImage } from "~/lib/file-system";
import { batch } from "~/utils/promise";

/** Helper functions for cleaning up content stored by the app. */
export const AppCleanUp = {
  /** Clean up images stored by the app but are no longer referenced.  */
  async images() {
    // Get all the uris of images saved in the database.
    const usedUris = (
      await Promise.all([
        ...[artists, playlists].map((schema) =>
          db
            .select({ artwork: schema.artwork })
            .from(schema)
            .where(isNotNull(schema.artwork)),
        ),
        ...[albums, tracks].flatMap((schema) => [
          db
            .select({ artwork: schema.altArtwork })
            .from(schema)
            .where(isNotNull(schema.altArtwork)),
          db
            .select({ artwork: schema.embeddedArtwork })
            .from(schema)
            .where(isNotNull(schema.embeddedArtwork)),
        ]),
      ])
    )
      .flat()
      .map(({ artwork }) => artwork!);

    // Get & delete all unused images.
    let deletedCount = 0;
    await batch({
      data: new Directory(ImageDirectory)
        .list()
        // There shouldn't be any directories in the "Image Directory".
        .filter((file) => !usedUris.some((uri) => file.uri === uri)),
      callback: (image) => deleteImage(image.uri),
      onBatchComplete: (isFulfilled) => {
        deletedCount += isFulfilled.length;
      },
    });

    console.log(`Deleted ${deletedCount} unlinked images.`);
  },

  /** Clean up content that's no longer necessary (ie: albums/artists with no tracks). */
  async media() {
    // Remove recently played media that's beyond what we display.
    await db
      .delete(playedMediaLists)
      .where(lt(playedMediaLists.lastPlayedAt, Date.now() - RECENT_RANGE_MS));

    // Remove unused albums.
    const allAlbums = await db.query.albums.findMany({
      columns: { id: true },
      with: { tracks: { columns: { id: true }, limit: 1 } },
    });
    const unusedAlbumIds = allAlbums
      .filter(({ tracks }) => tracks.length === 0)
      .map(({ id }) => id);
    await db
      .delete(albumsToArtists)
      .where(inArray(albumsToArtists.albumId, unusedAlbumIds));
    await db.delete(albums).where(inArray(albums.id, unusedAlbumIds));

    // Remove unused artists.
    const allArtists = await db.query.artists.findMany({
      columns: { name: true },
      with: {
        //? Relations used to filter out artists with no albums & tracks.
        albumsToArtists: { columns: { albumId: true }, limit: 1 },
        tracksToArtists: { columns: { trackId: true }, limit: 1 },
      },
    });
    const unusedArtistNames = allArtists
      .filter(
        ({ albumsToArtists, tracksToArtists }) =>
          albumsToArtists.length === 0 && tracksToArtists.length === 0,
      )
      .map(({ name }) => name);
    await db.delete(artists).where(inArray(artists.name, unusedArtistNames));
  },

  /**
   * Clean up tracks which are stored in the database but MediaStore no longer
   * picks up. Afterwards, revalidates media to see if they're still necessary.
   */
  async tracks(foundTrackIds: string[]) {
    // Get list of ids for tracks in our database that no longer get detected.
    const foundTrackIdsSet = new Set(foundTrackIds);
    const unusedTrackIds = (
      await Promise.all([
        db.select({ id: hiddenTracks.id }).from(hiddenTracks),
        db.select({ id: invalidTracks.id }).from(invalidTracks),
        db.select({ id: tracks.id }).from(tracks),
      ])
    )
      .flatMap((ids) => ids.map(({ id }) => id))
      .filter((id) => !foundTrackIdsSet.has(id));

    if (unusedTrackIds.length > 0) {
      await Promise.allSettled([
        db.delete(hiddenTracks).where(inArray(hiddenTracks.id, unusedTrackIds)),
        db
          .delete(invalidTracks)
          .where(inArray(invalidTracks.id, unusedTrackIds)),
        db.delete(tracks).where(inArray(tracks.id, unusedTrackIds)),
        db
          .delete(tracksToArtists)
          .where(inArray(tracksToArtists.trackId, unusedTrackIds)),
        db
          .delete(tracksToPlaylists)
          .where(inArray(tracksToPlaylists.trackId, unusedTrackIds)),
        db
          .delete(waveformSamples)
          .where(inArray(waveformSamples.trackId, unusedTrackIds)),
      ]);
    }

    // Clear the queue of tracks that no longer exist.
    await Queue.removeIds(unusedTrackIds);

    // Remove anything else that's unused.
    await this.media();
  },
};
