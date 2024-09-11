import { inArray } from "drizzle-orm";
import { getDefaultStore } from "jotai";

import { tracks } from "@/db/schema";
import { getTracks } from "@/db/queries";

import { isRNTPLoaded, replaceRNTPQueue } from "./rntp";
import { _playListRefAtom, _playViewRefAtom } from "../services/Persistent";

/**
 * Populate the RNTP queue if the queue is currently empty and if we've
 * played a media list in the last session.
 */
export async function preloadRNTPQueue() {
  if (await isRNTPLoaded()) return;
  console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
  const jotaiStore = getDefaultStore();
  const { listIndex } = await jotaiStore.get(_playViewRefAtom);
  const { trackIds } = await jotaiStore.get(_playListRefAtom);
  if (trackIds.length === 0) return;

  // Get tracks and put them in the correct order.
  const loadTracks = await getTracks([inArray(tracks.id, trackIds)]);
  const orderedTracks = trackIds.map(
    (tId) => loadTracks.find(({ id }) => tId === id)!,
  );

  await replaceRNTPQueue({ tracks: orderedTracks, startIndex: listIndex });
}
