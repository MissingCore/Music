import { inArray } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { tracks } from "@/db/schema";
import { getTracks } from "@/db/queries";

import { _currPlayListIdxAtom, _playListAtom } from "../services/Persistent";

import { isRNTPLoaded, replaceRNTPQueue } from "./rntp";

/**
 * Populate the RNTP queue if the queue is currently empty and if we've
 * played a media list in the last session.
 */
export async function preloadRNTPQueue() {
  if (await isRNTPLoaded()) return;
  console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
  const jotaiStore = getDefaultStore();
  const startIndex = await jotaiStore.get(_currPlayListIdxAtom);
  const trackIds = await jotaiStore.get(_playListAtom);
  if (trackIds.length === 0) return;

  // Get tracks and put them in the correct order.
  const loadTracks = await getTracks([inArray(tracks.id, trackIds)]);
  const orderedTracks = trackIds.map(
    (tId) => loadTracks.find(({ id }) => tId === id)!,
  );

  await replaceRNTPQueue({ tracks: orderedTracks, startIndex });
}
