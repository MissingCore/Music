import TrackPlayer from "react-native-track-player";

import type { TrackStatus } from "../services/next/Music";
import { RNTPManager, musicStore } from "../services/next/Music";

import { formatTrackforPlayer } from "./data";

/** Initialize the RNTP queue, loading the first 2 tracks. */
export async function preloadRNTPQueue() {
  if (await RNTPManager.isRNTPLoaded()) return;
  console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
  const { activeTrack, isInQueue } = musicStore.getState();
  if (!activeTrack) return;

  // Add the current playing track to the RNTP queue.
  await TrackPlayer.add({
    ...formatTrackforPlayer(activeTrack),
    "music::status": (isInQueue ? "QUEUE" : "RELOAD") satisfies TrackStatus,
  });
  // Add the 2nd track in the RNTP queue.
  await RNTPManager.reloadNextTrack();
}
