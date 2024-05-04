import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";
import { repeatAsyncAtom } from "@/features/playback/api/configs";
import { queueListAsyncAtom } from "@/features/playback/api/queue";
import {
  playingMediaAsyncAtom,
  trackDataAsyncAtom,
  trackListAsyncAtom,
} from "@/features/playback/api/track";

/**
 * @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] Read-only atom that asynchronously
 *  fetch information about the current playing track, those in the queue,
 *  and upcoming tracks.
 */
const upcomingTrackDataAsyncAtom = atom(async (get) => {
  try {
    const shouldRepeat = await get(repeatAsyncAtom);
    const currTrackData = await get(trackDataAsyncAtom);
    if (!currTrackData) throw new Error("No tracks being played.");
    const { listIndex: trackIdx } = await get(playingMediaAsyncAtom);
    const queueList = await get(queueListAsyncAtom);
    const { data: trackList } = await get(trackListAsyncAtom);

    // Keep only the information we want.
    const { id, name, artistName, coverSrc } = currTrackData;
    const nowPlaying = { id, name, artistName, coverSrc };

    // Get the same values, but for tracks in `queueList`.
    let nextInQueue: Array<typeof nowPlaying> = [];
    if (queueList.length > 0) {
      nextInQueue = (
        await Promise.all(queueList.map(getUpcomingTrackData))
      ).map(({ coverSrc, album, ...rest }) => {
        return { ...rest, coverSrc: album?.coverSrc ?? coverSrc };
      });
    }

    // Get the same values, but for up to the next 5 tracks in `trackList`.
    const next5Tracks = trackList.slice(trackIdx + 1, trackIdx + 6);
    if (next5Tracks.length < 5 && shouldRepeat) {
      next5Tracks.push(...trackList.slice(0, 5 - next5Tracks.length));
    }

    let nextTracks: Array<typeof nowPlaying> = [];
    if (next5Tracks.length > 0) {
      nextTracks = (
        await Promise.all(next5Tracks.map(getUpcomingTrackData))
      ).map(({ coverSrc, album, ...rest }) => {
        return { ...rest, coverSrc: album?.coverSrc ?? coverSrc };
      });
    }

    return [
      { title: "Now Playing", data: [nowPlaying] },
      { title: "Next in Queue", data: nextInQueue },
      { title: "Next 5 Tracks", data: nextTracks },
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

/**
 * @description Helper function to get the data we want to return with
 *  `upcomingListsDataAtom`.
 */
async function getUpcomingTrackData(id: string) {
  const trackData = await db.query.tracks.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    columns: { id: true, name: true, artistName: true, coverSrc: true },
    with: { album: { columns: { coverSrc: true } } },
  });
  if (!trackData) throw new Error("Track no longer exists.");
  return trackData;
}
