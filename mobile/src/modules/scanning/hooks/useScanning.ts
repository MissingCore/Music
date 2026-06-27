// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMediaLibraryPermissions } from "@missingcore/native-utils/media";
import { useCallback, useEffect, useState } from "react";

import { Resynchronize } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";

import { findAndSaveArtwork } from "../helpers/artwork";
import { findAndSaveAudio } from "../helpers/audio";
import { AppCleanUp } from "../helpers/cleanup";

import { Stopwatch } from "~/utils/debug";

/**
 * Reads our music library on load and index all supported files in the
 * SQLite database.
 */
export function useScanning(canStart: boolean) {
  const [permissionResponse, requestPermission] = useMediaLibraryPermissions();
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
      await findAndSaveArtwork();
    } else {
      await AppCleanUp.media();
    }
    await AppCleanUp.images();

    console.log(`Finished overall in ${stopwatch.stop()}.`);
    setStatus("complete");
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    if (!canStart) return;

    if (permissionResponse && status === undefined) {
      readMusicLibrary().catch((err) => {
        setError(err);
      });
    }
  }, [canStart, permissionResponse, readMusicLibrary, status]);

  return { completed: status === "complete", error };
}
