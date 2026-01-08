import { usePermissions as useMediaLibraryPermissions } from "expo-media-library";
import { useCallback, useEffect, useState } from "react";

import { Resynchronize } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { useSetup } from "~/hooks/useSetup";
import { findAndSaveArtwork } from "../helpers/artwork";
import { findAndSaveAudio } from "../helpers/audio";
import { AppCleanUp } from "../helpers/cleanup";
import { checkForMigrations } from "../helpers/migrations";

import { createImageDirectory } from "~/lib/file-system";
import { Stopwatch } from "~/utils/debug";

/**
 * Reads our music library on load and index all supported files in the
 * SQLite database.
 */
export function useOnboarding() {
  const [permissionResponse, requestPermission] = useMediaLibraryPermissions({
    granularPermissions: ["audio"],
  });
  const isReady = useSetup();
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

    // Only rescan on app launch if the setting is enabled.
    if (preferenceStore.getState().rescanOnLaunch) {
      // Find and save any audio files to the database.
      const { foundFiles, unstagedFiles } = await findAndSaveAudio();
      await AppCleanUp.tracks(foundFiles.map(({ id }) => id));
      // Make sure any modified tracks isn't being played.
      await Resynchronize.onModifiedTracks(unstagedFiles.map(({ id }) => id));

      // Find and save any images. We've previously did this in the background,
      // however it caused some weird bugs due to the lag generated. Since this
      // process rarely occurs, it should be fine to have the user stay on the
      // onboarding screen longer.
      createImageDirectory();
      await findAndSaveArtwork();
    } else {
      await AppCleanUp.media();
    }
    await AppCleanUp.images();

    console.log(`Finished overall in ${stopwatch.stop()}.`);
    setStatus("complete");
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    // Make sure the Zustand store is hydrated before we do anything.
    if (!isReady) return;

    if (permissionResponse && status === undefined) {
      readMusicLibrary().catch((err) => {
        setError(err);
      });
    }
  }, [isReady, permissionResponse, readMusicLibrary, status]);

  return { success: status === "complete", error };
}
