import TrackPlayer from "react-native-track-player";

import { AsyncAtomState, RNTPManager } from "../services/State";

import { getAtom } from "@/lib/jotai";
import { formatTrackforPlayer } from "./data";

/** Initialize the RNTP queue, loading the first 2 tracks. */
export async function preloadRNTPQueue() {
  if (await RNTPManager.isRNTPLoaded()) return;
  console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
  const activeTrack = await getAtom(AsyncAtomState.activeTrack);
  if (!activeTrack) return;
  const isPlayingFromQueue = await RNTPManager.isCurrActiveTrack();

  // Add the current playing track to the RNTP queue.
  await TrackPlayer.add({
    ...formatTrackforPlayer(activeTrack),
    "music::status": isPlayingFromQueue ? "QUEUE" : undefined,
  });
  // Add the 2nd track in the RNTP queue.
  await RNTPManager.refreshNextTrack();
}
