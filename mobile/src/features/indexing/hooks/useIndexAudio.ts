import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";

import { useMusicStore } from "@/modules/media/services/next/Music";
import { cleanUpArtwork } from "../api/artwork-cleanup";
import { saveArtworkOnce } from "../api/artwork-save";
import { cleanUpDb } from "../api/db-cleanup";
import { doAudioIndexing } from "../api/index-audio";
import { dataReadjustments } from "../api/index-override";

import { createImageDirectory } from "@/lib/file-system";
import { Stopwatch } from "@/utils/debug";

/**
 * Reads our music library on load and index all supported files in the
 * SQLite database.
 */
export function useIndexAudio() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ["audio"],
  });
  const isHydrated = useMusicStore((state) => state._hasHydrated);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error>();

  const readMusicLibrary = useCallback(async () => {
    const stopwatch = new Stopwatch();

    // Make sure we have permissions.
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain || status !== "granted") {
        if (status === "denied") setIsComplete(true);
        return;
      }
    }

    // Fix database entries if we make any "breaking" changes.
    await dataReadjustments();
    console.log(`Completed data adjustments in ${stopwatch.lapTime()}.`);

    const { foundFiles } = await doAudioIndexing();
    await cleanUpDb(new Set(foundFiles.map(({ id }) => id)));
    console.log(`Finished overall in ${stopwatch.stop()}.`);
    setIsComplete(true);

    /*  Start of the "background" tasks. */

    // Make sure this directory exists before saving images.
    await createImageDirectory();
    // Save artwork. Resumes where we left off if we didn't finish last session.
    //  - Make sure we run this after cleaning up deleted albums, artists, and tracks.
    await saveArtworkOnce();
    // Clean up any unlinked images.
    await cleanUpArtwork();
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    // Make sure the Zustand store is hydrated before we do anything.
    if (!isHydrated) return;

    if (permissionResponse && !isComplete) {
      readMusicLibrary().catch((err) => {
        setError(err);
      });
    }
  }, [isHydrated, permissionResponse, isComplete, readMusicLibrary]);

  return { success: isComplete, error };
}
