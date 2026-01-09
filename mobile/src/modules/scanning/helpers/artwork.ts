import {
  SaveFormat,
  saveArtwork,
} from "@missingcore/react-native-metadata-retriever";
import { createId } from "@paralleldrive/cuid2";
import { eq, inArray, isNotNull, or } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks } from "~/db/schema";

import { getAlbums, updateAlbum } from "~/api/album";
import { getTracks, updateTrack } from "~/api/track";
import { onboardingStore } from "../services/Onboarding";

import { ImageDirectory } from "~/lib/file-system";
import { Stopwatch } from "~/utils/debug";
import { BATCH_PRESETS } from "~/utils/promise";

type PartialTrack = {
  id: string;
  name: string;
  albumId: string | null;
  uri: string;
};

/** Save artwork for albums & tracks. */
export async function findAndSaveArtwork() {
  const stopwatch = new Stopwatch();

  // Ensure we don't unnecessarily search for artwork.
  const albumsWithCovers = await getAlbums({
    columns: ["id"],
    withTracks: false,
    where: [isNotNull(albums.artwork)],
  });
  const idsWithCover = albumsWithCovers.map(({ id }) => id);
  await db
    .update(tracks)
    .set({ fetchedArt: true })
    .where(
      or(inArray(tracks.albumId, idsWithCover), isNotNull(tracks.artwork)),
    );

  const uncheckedTracks = await getTracks({
    columns: ["id", "name", "albumId", "uri"],
    withAlbum: false,
    where: [eq(tracks.fetchedArt, false)],
  });
  // Sort tracks to optimize SQL queries.
  const singles: PartialTrack[] = [];
  const albumTracks: Record<string, PartialTrack[]> = {};
  uncheckedTracks.forEach((t) => {
    const key = t.albumId;
    if (key === null) singles.push(t);
    else if (Object.hasOwn(albumTracks, key)) albumTracks[key]?.push(t);
    else albumTracks[key] = [t];
  });

  // Initiate the image saving phase.
  onboardingStore.setState({
    phase: "image",
    checked: 0,
    unchecked: uncheckedTracks.length,
    found: 0,
  });

  let newArtworkCount = 0;
  let checkedFiles = 0;
  let prevRemainder = 0;

  // Get artwork for albums.
  for (const [albumId, values] of Object.entries(albumTracks)) {
    await saveSinglesArtwork(
      values,
      async ({ artworkUri }) => {
        await updateAlbum(albumId, { embeddedArtwork: artworkUri });
        newArtworkCount++;
      },
      { endEarly: true },
    );
    // Prevent excessive `setState` on Zustand store which may cause an
    // "Warning: Maximum update depth exceeded.".
    prevRemainder = checkedFiles % BATCH_PRESETS.PROGRESS;
    checkedFiles += values.length;
    if (checkedFiles % BATCH_PRESETS.PROGRESS < prevRemainder) {
      onboardingStore.setState({ checked: checkedFiles });
    }
  }

  // Get artwork for tracks.
  await saveSinglesArtwork(
    singles,
    async ({ artworkUri, trackId }) => {
      await updateTrack(trackId, { embeddedArtwork: artworkUri });
      newArtworkCount++;
    },
    {
      onEndIteration: () => {
        checkedFiles++;
        if (checkedFiles % BATCH_PRESETS.PROGRESS === 0) {
          onboardingStore.setState({ checked: checkedFiles });
        }
      },
    },
  );
  console.log(
    `Finished saving ${newArtworkCount} new cover images in ${stopwatch.lapTime()}.`,
  );
}

//#region Helpers
/**
 * Create a uri associated with the artwork on the track.
 *
 * **Note:** Will not throw an error.
 */
export async function getArtworkUri(uri: string) {
  try {
    const artworkUri = await saveArtwork(uri, {
      compress: 0.85,
      format: SaveFormat.WEBP,
      saveUri: `${ImageDirectory}/${createId()}.webp`,
    });
    return { error: false, uri: artworkUri };
  } catch {
    console.log(`[Error] Failed to save image for "${uri}".`);
    return { error: true, uri: null };
  }
}
//#endregion

//#region Internal Utils
/** Iterate over a list of tracks, finding and saving its artwork. */
async function saveSinglesArtwork(
  singles: PartialTrack[],
  onSave: (info: { artworkUri: string; trackId: string }) => Promise<void>,
  options?: { endEarly?: boolean; onEndIteration?: VoidFunction },
) {
  for (const { id: trackId, uri } of singles) {
    // Indicate we attempted to find artwork for a track. Do this before
    // physically attempting to save the artwork in case an OOM error occurs,
    // in which the app will essentially become "bricked".
    await updateTrack(trackId, { fetchedArt: true });
    const { uri: artworkUri } = await getArtworkUri(uri);
    if (artworkUri) {
      await onSave({ artworkUri, trackId });
      onboardingStore.setState((prev) => ({ found: prev.found + 1 }));
      if (options?.endEarly) return;
    }
    if (options?.onEndIteration) options.onEndIteration();
  }
}
//#endregion
