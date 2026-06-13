import type { MusicAsset } from "@missingcore/native-utils";
import { getMusicAssets } from "@missingcore/native-utils";
import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { inArray } from "drizzle-orm";
import { File } from "expo-file-system";
import type { Asset as MediaLibraryAsset } from "expo-media-library/legacy";
import { getAssetsAsync } from "expo-media-library/legacy";

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

  /*
    ? Takes ~30 seconds to return metadata for all the tracks.
  */
  // Get all audio files discoverable by `expo-media-library`.
  const foundAssets2: MusicAsset[] = [];
  let isComplete2 = false;
  let lastRead2: number | undefined;
  do {
    const assets2 = await getMusicAssets({
      after: lastRead2,
      first: BATCH_PRESETS.LIGHT,
      resolveWithFullInfo: true,
    });
    foundAssets2.push(...assets2.assets);
    lastRead2 = assets2.endCursor;
    isComplete2 = !assets2.hasNextPage;
  } while (!isComplete2);

  const discoveredTracks2 = foundAssets2.filter(
    (a) =>
      // Ensure track is in the allowlist if it's non-empty.
      (listAllow.length === 0 || listAllow.some((p) => a.uri.startsWith(p))) &&
      // Ensure track isn't in the blocklist.
      !listBlock.some((p) => a.uri.startsWith(p)) &&
      // Ensure track meets the minimum duration requirement.
      (a.duration ?? 0) > minSeconds,
  );
  console.log(
    `Found ${foundAssets2.length} tracks, filtered down to ${discoveredTracks2.length} in ${stopwatch.lapTime()}.`,
  );

  console.log(foundAssets2);
  //#endregion

  const expoMediaIds = new Set(foundAssets.map((t) => t.id));
  const ourForkIds = new Set(foundAssets2.map((t) => t.id));

  const onlyMediaIds = expoMediaIds.difference(ourForkIds);
  const onlyForkIds = ourForkIds.difference(expoMediaIds);

  console.log(foundAssets.filter((t) => onlyMediaIds.has(t.id)));
  console.log(foundAssets2.filter((t) => onlyForkIds.has(t.id)));

  //#region Change Detection
  const savedTracks = await db.query.tracks.findMany({
    columns: {
      id: true,
      modificationTime: true,
      uri: true,
      editedMetadata: true,
    },
  });
  const hiddenTracks = await db.query.hiddenTracks.findMany();
  const erroredTracks = await db.query.invalidTracks.findMany();
  // Format data as objects for faster reads inside a loop.
  const savedMap = Object.fromEntries(savedTracks.map((t) => [t.id, t]));
  const hiddenMap = Object.fromEntries(hiddenTracks.map((t) => [t.id, t]));
  const erroredMap = Object.fromEntries(erroredTracks.map((t) => [t.id, t]));

  // Find the tracks we can skip indexing or need updating.
  const modified = new Set<string>();
  const unmodified = new Set<string>();
  discoveredTracks.forEach(({ id, modificationTime, uri }) => {
    // Skip if track is hidden.
    if (hiddenMap[id]) return unmodified.add(id);

    // Skip if track is new.
    const isSaved = savedMap[id];
    const isInvalid = erroredMap[id];
    if (!isSaved && !isInvalid) return;

    // Get context for determining if track has been modified.
    const isMaybeModified =
      Math.abs(modificationTime - (isSaved ?? isInvalid)!.modificationTime) >
      CHANGE_DELTA;
    const hasEdited = typeof isSaved?.editedMetadata === "number";
    let isDifferentUri = (isSaved ?? isInvalid)!.uri !== uri;

    // A track which has been moved may be detected twice by `expo-media-library`
    // in its new & old location with the same `id`. This logic helps mark the
    // track as modified.
    if (isDifferentUri && unmodified.has(id)) unmodified.delete(id);
    else if (!isDifferentUri && modified.has(id)) isDifferentUri = true; // Encountered old location.

    // Retry indexing if modification time or uri is different.
    if ((!hasEdited && isMaybeModified) || isDifferentUri) modified.add(id);
    else unmodified.add(id);
  });

  const unstagedTracks = discoveredTracks.filter(
    ({ id }) => !unmodified.has(id),
  );

  scanningProgressStore.setState({
    scannedTracks: 0,
    modifiedTracks: discoveredTracks.length - unmodified.size,
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
    foundFiles: discoveredTracks,
    unstagedFiles: unstagedTracks,
    changed: discoveredTracks.length - unmodified.size,
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
