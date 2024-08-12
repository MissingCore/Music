import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";

import { repeatAsyncAtom } from "@/features/playback/api/configs";
import {
  playingMediaAsyncAtom,
  trackListAsyncAtom,
} from "@/features/playback/api/track";
import { queueListAsyncAtom } from "@/features/playback/api/queue";

import { pickKeys } from "@/utils/object";

// The information we want to return.
const wantedKeys = ["id", "name", "artistName", "artwork"] as const;

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const queueTrackListAsyncAtom = atom(async (get) => {
  const queueList = await get(queueListAsyncAtom);
  const data = await Promise.all(queueList.map(getTrackData));
  return data.map((track) => pickKeys(track!, wantedKeys));
});
/** Return tracks in the queue. */
export const queueTrackListAtom = unwrap(
  queueTrackListAsyncAtom,
  (prev) => prev ?? [],
);

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const nextTrackListAsyncAtom = atom(async (get) => {
  const shouldRepeat = await get(repeatAsyncAtom);
  const { listIndex: startIndex } = await get(playingMediaAsyncAtom);
  const { data: trackList } = await get(trackListAsyncAtom);

  // Get up to the next 5 tracks in `trackList`.
  const upcomingTracks = trackList.slice(startIndex + 1, startIndex + 6);
  while (trackList.length > 0 && shouldRepeat && upcomingTracks.length < 5) {
    upcomingTracks.push(...trackList.slice(0, 5 - upcomingTracks.length));
  }
  const data = await Promise.all(upcomingTracks.map(getTrackData));

  return data.map((track) => pickKeys(track!, wantedKeys));
});
/** Return the next 5 tracks. */
export const nextTrackListAtom = unwrap(
  nextTrackListAsyncAtom,
  (prev) => prev ?? [],
);

/** Get a given track and format its cover. */
async function getTrackData(id: string) {
  return await getTrack([eq(tracks.id, id)]);
}
