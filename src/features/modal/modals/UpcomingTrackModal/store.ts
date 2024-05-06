import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";

import { repeatAsyncAtom } from "@/features/playback/api/configs";
import { queueListAsyncAtom } from "@/features/playback/api/queue";
import {
  playingMediaAsyncAtom,
  trackDataAsyncAtom,
  trackListAsyncAtom,
} from "@/features/playback/api/track";

import { pickKeys } from "@/utils/object";

/**
 * @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] Information about the current playing
 *  track, those in the queue, and upcoming tracks.
 */
const upcomingTrackDataAsyncAtom = atom(async (get) => {
  try {
    const shouldRepeat = await get(repeatAsyncAtom);
    const trackData = await get(trackDataAsyncAtom);
    if (!trackData) throw new Error("No tracks being played.");
    const { listIndex } = await get(playingMediaAsyncAtom);
    const queueList = await get(queueListAsyncAtom);
    const { data: trackList } = await get(trackListAsyncAtom);

    // The information we want to return.
    const wantedKeys = ["id", "name", "artistName", "coverSrc"] as const;

    // Get up to the next 5 tracks in `trackList`.
    const next5Tracks = trackList.slice(listIndex + 1, listIndex + 6);
    while (trackList.length > 0 && shouldRepeat && next5Tracks.length < 5) {
      next5Tracks.push(...trackList.slice(0, 5 - next5Tracks.length));
    }

    return [
      { title: "Now Playing", data: [pickKeys(trackData, wantedKeys)] },
      {
        title: "Next in Queue",
        data: (await Promise.all(queueList.map(getTrackData))).map((track) =>
          pickKeys(track, wantedKeys),
        ),
      },
      {
        title: "Next 5 Tracks",
        data: (await Promise.all(next5Tracks.map(getTrackData))).map((track) =>
          pickKeys(track, wantedKeys),
        ),
      },
    ];
  } catch (err) {
    return undefined;
  }
});
/** @description Information about the tracks to be played. */
export const upcomingTrackDataAtom = unwrap(
  upcomingTrackDataAsyncAtom,
  (prev) => prev ?? undefined,
);

/** @description Get a given track and format its cover. */
async function getTrackData(id: string) {
  return await getTrack([eq(tracks.id, id)]);
}
