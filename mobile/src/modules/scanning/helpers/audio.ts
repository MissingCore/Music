import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { inArray } from "drizzle-orm";
import { File } from "expo-file-system";
import type { Asset as MediaLibraryAsset } from "expo-media-library";
import { getAssetsAsync } from "expo-media-library";

import { db } from "~/db";
import type { InvalidTrack } from "~/db/schema";
import { invalidTracks, tracksToArtists, tracksToGenres } from "~/db/schema";

import { upsertAlbums } from "~/data/album/api";
import { AlbumArtistsKey } from "~/data/album/utils";
import { createArtists } from "~/data/artist/api";
import { createFolders } from "~/data/folder/api";
import { createGenres } from "~/data/genre/api";
import { deleteTracks, upsertTracks } from "~/data/track/api";
import { preferenceStore } from "~/stores/Preference/store";
import { scanningProgressStore } from "../ScanningProgress";

import { getExcludedColumns } from "~/lib/drizzle";
import { Stopwatch } from "~/utils/debug";
import { chunkArray } from "~/utils/object";
import { BATCH_PRESETS, isFulfilled, isRejected } from "~/utils/promise";
import {
  addTrailingSlash,
  getSafeUri,
  removeFileExtension,
  splitOn,
} from "~/utils/string";

/**
 * Difference in `modificiationTime` to trigger a refetch. This is due to
 * Android sometimes changing `modificationTime` with a delta of ~2s even
 * though the file itself hasn't been touched.
 *  - Use the "Deep Rescan" feature if there's an actual update within 5
 *  minutes.
 *
 * Ref:
 *  - https://stackoverflow.com/a/8354791
 *  - https://stackoverflow.com/a/11547476
 */
const CHANGE_DELTA = 5 * 60 * 1000;

/** Index tracks with their metadata into our database. */
export async function findAndSaveAudio() {
  const stopwatch = new Stopwatch();

  //#region Media Discovery
  const {
    listAllow: _listAllow,
    listBlock: _listBlock,
    minSeconds,
  } = preferenceStore.getState();
  const listAllow = _listAllow.map((p) => `file://${addTrailingSlash(p)}`);
  const listBlock = _listBlock.map((p) => `file://${addTrailingSlash(p)}`);

  // Get all audio files discoverable by `expo-media-library`.
  const foundAssets: MediaLibraryAsset[] = [];
  let isComplete = false;
  let lastRead: string | undefined;
  do {
    const { assets, endCursor, hasNextPage } = await getAssetsAsync({
      after: lastRead,
      first: BATCH_PRESETS.LIGHT,
      mediaType: "audio",
    });
    foundAssets.push(...assets);
    lastRead = endCursor;
    isComplete = !hasNextPage;
  } while (!isComplete);

  const discoveredTracks = foundAssets.filter(
    (a) =>
      // Ensure track is in the allowlist if it's non-empty.
      (listAllow.length === 0 || listAllow.some((p) => a.uri.startsWith(p))) &&
      // Ensure track isn't in the blocklist.
      !listBlock.some((p) => a.uri.startsWith(p)) &&
      // Ensure track meets the minimum duration requirement.
      a.duration > minSeconds,
  );
  console.log(
    `Found ${foundAssets.length} tracks, filtered down to ${discoveredTracks.length} in ${stopwatch.lapTime()}.`,
  );
  //#endregion

  //#region Change Detection
  const [prevSaved, prevHidden, prevErrored] = await Promise.all([
    db.query.tracks.findMany({
      columns: {
        id: true,
        modificationTime: true,
        uri: true,
        editedMetadata: true,
      },
    }),
    db.query.hiddenTracks.findMany(),
    db.query.invalidTracks.findMany(),
  ]);
  // Format data as objects for faster reads inside a loop.
  const savedIdMap = Object.fromEntries(prevSaved.map((t) => [t.id, t]));
  const savedURIMap = Object.fromEntries(prevSaved.map((t) => [t.uri, t]));
  const hiddenIdMap = Object.fromEntries(prevHidden.map((t) => [t.id, t]));
  const hiddenURIMap = Object.fromEntries(prevHidden.map((t) => [t.uri, t]));
  const erroredIdMap = Object.fromEntries(prevErrored.map((t) => [t.id, t]));
  const erroredURIMap = Object.fromEntries(prevErrored.map((t) => [t.uri, t]));

  // Find the tracks we can skip indexing or need updating.
  const seenIdsMap: Record<string, string> = {};
  const newOrModified = new Set<string>();
  const unmodified = new Set<string>();
  //? For weird edge-cases (ie: seeing the same `id` or `uri` multiple times).
  const broken = new Set<string>();

  discoveredTracks.forEach(({ id, modificationTime, uri }) => {
    //#region "Broken" Track Handling
    //? 1. Mark track as "broken" if MediaStore returns the `id` or `uri` again.
    const seenIdAgain = seenIdsMap[id]; // Returns prior `uri` for that `id`.
    seenIdsMap[id] = uri;
    const seenURIAgain = newOrModified.has(uri) || unmodified.has(uri);
    if (seenIdAgain !== undefined || seenURIAgain) {
      [seenIdAgain, uri].forEach((brokenURI) => {
        if (!brokenURI) return;
        newOrModified.delete(brokenURI);
        unmodified.delete(brokenURI);
        broken.add(brokenURI);
      });
      return;
    }

    //? 2. Mark track as "broken" if `uri` is the same, but `id` has changed.
    if (
      (savedURIMap[uri] && savedURIMap[uri].id !== id) ||
      (hiddenURIMap[uri] && hiddenURIMap[uri].id !== id) ||
      (erroredURIMap[uri] && erroredURIMap[uri].id !== id)
    ) {
      [
        savedURIMap[uri]?.uri,
        hiddenURIMap[uri]?.uri,
        erroredURIMap[uri]?.uri,
        uri,
      ].forEach((brokenURI) => {
        if (!brokenURI) return;
        newOrModified.delete(brokenURI);
        unmodified.delete(brokenURI);
        broken.add(brokenURI);
      });
      return;
    }
    //? 3. Mark track as "broken" if `id` is the same, but `uri` has changed.
    if (
      (savedIdMap[id] && savedIdMap[id].uri !== uri) ||
      (hiddenIdMap[id] && hiddenIdMap[id].uri !== uri) ||
      (erroredIdMap[id] && erroredIdMap[id].uri !== uri)
    ) {
      [
        savedIdMap[id]?.uri,
        hiddenIdMap[id]?.uri,
        erroredIdMap[id]?.uri,
        uri,
      ].forEach((brokenURI) => {
        if (!brokenURI) return;
        newOrModified.delete(brokenURI);
        unmodified.delete(brokenURI);
        broken.add(brokenURI);
      });
      return;
    }

    //? 4. Ignore if track is "broken".
    if (broken.has(uri)) return;
    //#endregion

    //? 5. Ignore if track is hidden.
    if (hiddenURIMap[uri]) return unmodified.add(uri);

    //? 6. Handle if track is new.
    const isSaved = savedURIMap[uri];
    const isInvalid = erroredURIMap[uri];
    if (!isSaved && !isInvalid) return newOrModified.add(uri);

    //? 7. Determine if track is modified based on difference in `modificationTime`
    //? and whether it has been manually edited by the user.
    const hasEdited = typeof isSaved?.editedMetadata === "number";
    const isMaybeModified =
      Math.abs(modificationTime - (isSaved ?? isInvalid)!.modificationTime) >
      CHANGE_DELTA;

    if (!hasEdited && isMaybeModified) newOrModified.add(uri);
    else unmodified.add(uri);
  });

  const unstagedTracks = discoveredTracks.filter(({ uri }) =>
    newOrModified.has(uri),
  );

  scanningProgressStore.setState({
    scannedTracks: 0,
    modifiedTracks: newOrModified.size,
    failedTrackScans: 0,
  });
  console.log(`Determined unstaged content in ${stopwatch.lapTime()}.`);
  //#endregion

  //#region Indexing
  // Keep tracks of album ids from reading `artistsKey` & the album name.
  const albumIdMap: Record<string, Record<string, string>> = {};

  const delimiters = preferenceStore.getState().separators;
  const safeRetrieveMetadata = safeRetrieveMetadataFactory(delimiters);
  // Save tracks in batches of 50 (a good number if the user leaves midway
  // as we would have saved at least some tracks).
  const trackBatches = chunkArray(unstagedTracks, 50);
  for (const tBatch of trackBatches) {
    const res = await Promise.allSettled(tBatch.map(safeRetrieveMetadata));
    const results = res.filter(isFulfilled).map((r) => r.value);
    const errors: InvalidTrack[] = res.filter(isRejected).map((r) => r.reason);
    scanningProgressStore.setState((prev) => ({
      scannedTracks: prev.scannedTracks + results.length,
      failedTrackScans: prev.failedTrackScans + errors.length,
    }));

    if (errors.length > 0) {
      // Use `deleteTracks` to also delete associated relations.
      await deleteTracks(errors.map(({ id }) => ({ id })));
      await db.insert(invalidTracks).values(errors).onConflictDoUpdate({
        target: invalidTracks.id,
        set: UpsertInvalidTrackFields,
      });
    }
    if (results.length === 0) continue;
    await createFolders(results.map(({ uri }) => uri));

    //#region Album & Artist Creation
    const usedArtists = new Set<string>();
    const usedAlbums: Record<string, Set<string>> = {};
    const trackArtistRels: Array<{ trackId: string; artistName: string }> = [];
    results.forEach(({ id, artistNames, album }) => {
      // Handle track-artist relations.
      artistNames.forEach((artistName) => {
        usedArtists.add(artistName);
        trackArtistRels.push({ trackId: id, artistName });
      });

      // Handle album-artist relations.
      if (album) {
        album.albumArtists.forEach((name) => usedArtists.add(name));
        if (usedAlbums[album.artistsKey]) {
          usedAlbums[album.artistsKey]?.add(album.name);
        } else usedAlbums[album.artistsKey] = new Set([album.name]);
      }
    });

    const artistEntries = [...usedArtists].map((name) => ({ name }));
    if (artistEntries.length > 0) await createArtists(artistEntries);

    const albumEntries = Object.entries(usedAlbums).flatMap(
      ([artistsKey, names]) => [...names].map((name) => ({ name, artistsKey })),
    );
    if (albumEntries.length > 0) {
      // Upserting album will also create the album-artist relations.
      const createdAlbums = await upsertAlbums(albumEntries);
      createdAlbums.map(({ id, name, artistsKey }) => {
        if (albumIdMap[artistsKey]) albumIdMap[artistsKey][name] = id;
        else albumIdMap[artistsKey] = { [name]: id };
      });
    }
    //#endregion

    //#region Genre Creation
    const newGenres = new Set<string>();
    const trackGenreRels = results.flatMap(({ id, genres: trackGenres }) => {
      trackGenres.forEach((genre) => newGenres.add(genre));
      return trackGenres.map((genre) => ({ trackId: id, genreName: genre }));
    });

    const genreEntries = [...newGenres].map((name) => ({ name }));
    if (genreEntries.length > 0) await createGenres(genreEntries);
    //#endregion

    //#region Upsert Tracks
    const trackEntries = results.map(({ artistNames: _, album, ...t }) => {
      let albumId: string | null = null;
      if (album) albumId = albumIdMap[album.artistsKey]?.[album.name] || null;
      return { ...t, albumId, discoverTime: Date.now() };
    });
    const trackIds = trackEntries.map(({ id }) => id);
    await upsertTracks(trackEntries);
    await db.delete(invalidTracks).where(inArray(invalidTracks.id, trackIds));
    // Replace old artist relations.
    await db
      .delete(tracksToArtists)
      .where(inArray(tracksToArtists.trackId, trackIds));
    if (trackArtistRels.length > 0) {
      await db
        .insert(tracksToArtists)
        .values(trackArtistRels)
        .onConflictDoNothing();
    }
    // Replace old genre relations.
    await db
      .delete(tracksToGenres)
      .where(inArray(tracksToGenres.trackId, trackIds));
    if (trackGenreRels.length > 0) {
      await db
        .insert(tracksToGenres)
        .values(trackGenreRels)
        .onConflictDoNothing();
    }
    //#endregion
  }
  //#endregion

  const { scannedTracks, failedTrackScans } = scanningProgressStore.getState();
  console.log(
    `Found/updated ${scannedTracks} tracks & encountered ${failedTrackScans} errors in ${stopwatch.lapTime()}.` +
      `\nCompleted finding & saving audio in ${stopwatch.stop()}`,
  );

  return {
    foundFiles: discoveredTracks.filter(({ uri }) => !broken.has(uri)),
    unstagedFiles: unstagedTracks,
    changed: newOrModified.size,
  };
}

//#region Internal Helpers
const wantedMetadata = [
  ...MetadataPresets.standard,
  ...["discNumber", "genre", "bitrate", "sampleMimeType", "sampleRate"],
] as const;

/**
 * Get the metadata associated with a track.
 *
 * **Note:** We return `album`, which is non-standard and should be used
 * to create an Album and then swapped out with the created `albumId`.
 */
async function getTrackMetadata(
  asset: MediaLibraryAsset,
  delimiters: string[],
) {
  const { id, uri, duration, modificationTime, filename } = asset;
  const { bitrate, sampleRate, ...t } = await getMetadata(uri, wantedMetadata);
  let fileSize = 0;
  try {
    const file = new File(getSafeUri(uri));
    if (file.exists) fileSize = file.size ?? 0;
  } catch (err) {
    // The new `expo-file-system` API will throw an error if certain characters are
    // in the URI when it previously didn't.
    console.log(err);
  }

  const trimmedArtistName = t.artist?.trim() || null;
  const trimmedGenre = t.genre?.trim() || null;

  let newAlbum;
  const trimmedAlbumTitle = t.albumTitle?.trim() || null;
  const trimmedAlbumArtist = t.albumArtist?.trim() || null;
  if (trimmedAlbumTitle && trimmedAlbumArtist) {
    const albumArtists = splitOn(trimmedAlbumArtist, delimiters);
    const artistsKey = AlbumArtistsKey.from(albumArtists);
    if (artistsKey) {
      newAlbum = { name: trimmedAlbumTitle, artistsKey, albumArtists };
    }
  }

  return {
    id,
    name: t.title?.trim() || removeFileExtension(filename),
    /** @deprecated Do not use this field directly. */
    rawArtistName: trimmedArtistName,
    artistNames: trimmedArtistName
      ? splitOn(trimmedArtistName, delimiters)
      : [],
    album: newAlbum,
    track: t.trackNumber,
    disc: t.discNumber,
    year: t.year,
    format: t.sampleMimeType,
    genres: trimmedGenre ? splitOn(trimmedGenre, delimiters) : [],
    bitrate,
    sampleRate,
    duration,
    uri,
    modificationTime,
    fetchedArt: false,
    size: fileSize,
  };
}

/** Returns `TrackMetadata` or `InvalidTrack`. */
function safeRetrieveMetadataFactory(delimiters: string[]) {
  return async (asset: MediaLibraryAsset) => {
    const { id, uri, modificationTime } = asset;
    try {
      const trackEntry = await getTrackMetadata(asset, delimiters);
      return Promise.resolve(trackEntry);
    } catch (err) {
      const isError = err instanceof Error;
      const errorInfo = {
        errorName: isError ? err.name : "UnknownError",
        errorMessage: isError ? err.message : "Rejected for unknown reasons.",
      };
      // We may end up here if the track at the given uri doesn't exist anymore.
      console.log(`[Track ${id}] ${errorInfo.errorMessage}`);
      return Promise.reject({ id, uri, modificationTime, ...errorInfo });
    }
  };
}

const UpsertInvalidTrackFields = getExcludedColumns([
  "uri",
  "errorName",
  "errorMessage",
  "modificationTime",
]);
//#endregion
