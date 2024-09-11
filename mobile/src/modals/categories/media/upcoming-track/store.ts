import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";

import {
  _playViewRefAtom,
  _playListRefAtom,
  _queueAtom,
  _repeatAtom,
} from "@/modules/media/services/Persistent";

import { pickKeys } from "@/utils/object";

// The information we want to return.
const wantedKeys = ["id", "name", "artistName", "artwork"] as const;

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const queueTrackListAsyncAtom = atom(async (get) => {
  const queueList = await get(_queueAtom);
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
  const shouldRepeat = await get(_repeatAtom);
  const { listIndex: startIndex } = await get(_playViewRefAtom);
  const { trackIds } = await get(_playListRefAtom);

  // Get up to the next 5 tracks in `trackList`.
  const upcomingTracks = trackIds.slice(startIndex + 1, startIndex + 6);
  while (trackIds.length > 0 && shouldRepeat && upcomingTracks.length < 5) {
    upcomingTracks.push(...trackIds.slice(0, 5 - upcomingTracks.length));
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
