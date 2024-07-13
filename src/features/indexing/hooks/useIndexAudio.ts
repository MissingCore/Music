import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { getDefaultStore } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { loadTrackAtom } from "@/features/playback/api/track";
import { cleanUpArtwork } from "../api/artwork-cleanup";
import { saveArtworkOnce } from "../api/artwork-save";
import { cleanUpDb } from "../api/db-cleanup";
import { indexAudio } from "../api/index-audio";

import { createImageDirectory } from "@/lib/file-system";
import { Stopwatch } from "@/utils/debug";

/**
 * @description Reads our music library on load and index all supported files
 *  in the SQLite database.
 */
export function useIndexAudio() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ["audio"],
  });
  const [isComplete, setIsComplete] = useState(false);

  const readMusicLibrary = useCallback(async () => {
    const stopwatch = new Stopwatch();

    // Make sure we have permissions.
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain || status === "denied") {
        if (status === "denied") setIsComplete(true);
        return;
      }
    }

    const foundAudioFiles = await indexAudio();
    await cleanUpDb(new Set(foundAudioFiles.map(({ id }) => id)));
    console.log(`Finished overall in ${stopwatch.lapTime()}.`);

    // Make sure this directory exists before saving images.
    await createImageDirectory();

    // Save artwork in the background. Resumes where we left off if we
    // didn't finish indexing artwork last session.
    //  - Make sure we run this after cleaning up deleted albums, artists, and tracks.
    saveArtworkOnce().then(() => {
      // Clean up any unlinked images in the background.
      cleanUpArtwork();
    });

    // Allow audio to play in the background.
    await Audio.setAudioModeAsync({ staysActiveInBackground: true });
    await getDefaultStore().set(loadTrackAtom);

    setIsComplete(true);
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    if (permissionResponse && !isComplete) readMusicLibrary();
  }, [permissionResponse, isComplete, readMusicLibrary]);

  /** The status of audio indexing — does not necessarily mean we have permissions. */
  return isComplete;
}
