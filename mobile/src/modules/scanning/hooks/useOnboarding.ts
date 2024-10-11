import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";

import { useHasHydratedStores } from "@/hooks/useHasHydratedStores";
import { Resynchronize } from "@/modules/media/services/Music";
import { findAndSaveArtwork, cleanupImages } from "../helpers/artwork";
import { findAndSaveAudio, cleanupDatabase } from "../helpers/audio";
import { checkForMigrations } from "../helpers/migrations";

import { createImageDirectory } from "@/lib/file-system";
import { Stopwatch } from "@/utils/debug";

/**
 * Reads our music library on load and index all supported files in the
 * SQLite database.
 */
export function useOnboarding() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ["audio"],
  });
  const isHydrated = useHasHydratedStores();
  const [status, setStatus] = useState<"in-progress" | "complete" | undefined>(
    undefined,
  );
  const [error, setError] = useState<Error>();

  const readMusicLibrary = useCallback(async () => {
    const stopwatch = new Stopwatch();

    // Make sure we have permissions.
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain || status !== "granted") {
        if (status === "denied") setStatus("complete");
        return;
      }
    }
    setStatus("in-progress");

    // Fix database entries if we make any "breaking" changes.
    await checkForMigrations();
    console.log(`Completed migrations in ${stopwatch.lapTime()}.`);

    // Find and save any audio files to the database.
    const { foundFiles, unstagedFiles } = await findAndSaveAudio();
    await cleanupDatabase(foundFiles.map(({ id }) => id));
    // Make sure any modified tracks doesn't belong in the current playing list.
    await Resynchronize.onUpdatedList(unstagedFiles.map(({ id }) => id));

    // Find and save any images. We've previously did this in the background,
    // however it caused some weird bugs due to the lag generated. Since this
    // process rarely occurs, it should be fine to have the user stay on the
    // onboarding screen longer.
    await createImageDirectory();
    await findAndSaveArtwork();
    await cleanupImages();

    console.log(`Finished overall in ${stopwatch.stop()}.`);
    setStatus("complete");
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    // Make sure the Zustand store is hydrated before we do anything.
    if (!isHydrated) return;

    if (permissionResponse && status === undefined) {
      readMusicLibrary().catch((err) => {
        setError(err);
      });
    }
  }, [isHydrated, permissionResponse, readMusicLibrary, status]);

  return { success: status === "complete", error };
}
