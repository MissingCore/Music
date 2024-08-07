import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { getDefaultStore } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { loadTrackAtom } from "@/features/playback/api/track";
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

    // Allow audio to play in the background.
    await Audio.setAudioModeAsync({ staysActiveInBackground: true });
    setIsComplete(true);
    await getDefaultStore().set(loadTrackAtom);

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
    if (permissionResponse && !isComplete) {
      readMusicLibrary().catch((err) => {
        setError(err);
      });
    }
  }, [permissionResponse, isComplete, readMusicLibrary]);

  return { success: isComplete, error };
}
