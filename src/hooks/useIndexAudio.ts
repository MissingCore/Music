import { useEffect, useState } from "react";
import * as MediaLibrary from "expo-media-library";

import { db } from "@/db";
import { getMusicInfoAsync } from "@/utils/getMusicInfoAsync";

/**
 * @description Reads our music library on load and index all MP3 files
 *  in the SQLite database.
 */
export function useIndexAudio() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [isComplete, setIsComplete] = useState(false);

  async function readMusicLibrary() {
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain) return;
      if (status === "denied") {
        setIsComplete(true);
        return;
      }
    }

    // Get the number of audio tracks as we only load the first 20
    const { totalCount } = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
    });
    const { assets: allAudio } = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: totalCount,
    });

    // Keep only the MP3 files
    const musicFiles = allAudio.filter((a) => a.filename.endsWith(".mp3"));

    if (musicFiles.length > 1) {
      musicFiles.map(({ uri }) => getMusicMetadata(uri));
    }

    setIsComplete(true);
  }

  useEffect(() => {
    if (permissionResponse && !isComplete) readMusicLibrary();
  }, [permissionResponse, isComplete]);

  return {
    /** The status of audio indexing — does not necessarily mean we have permissions. */
    isComplete,
  };
}

/** @description Get music metadata (ie: title, artist, album, year). */
async function getMusicMetadata(uri: string) {
  const res = await getMusicInfoAsync(uri);
  if (res) {
    const { cover: _, ...metadata } = res;
    console.log(metadata);
  }
  return;
}
