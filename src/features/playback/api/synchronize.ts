import { atom } from "jotai";

import { shuffleAsyncAtom } from "./configs";
import { recentlyPlayedAsyncAtom } from "./recent";
import { playingMediaAsyncAtom, trackListAsyncAtom } from "./track";
import type { TrackListSource } from "../types";
import { areTrackReferencesEqual, refreshTrackListData } from "../utils";

type ResynchronizeArgs =
  | { action: "delete"; data: TrackListSource }
  | {
      action: "rename";
      data: { old: TrackListSource; latest: TrackListSource };
    }
  | { action: "update"; data: TrackListSource | null };

/**
 * @description Helper to synchronize Jotai state with React Query state.
 *  This synchronzies with the track list which we play from and "Recent
 *  Tracks" feature.
 */
export const resynchronizeOnAtom = atom(
  null,
  async (get, set, { action, data }: ResynchronizeArgs) => {
    // Synchronize "Recently Played" list.
    if (action !== "update") {
      const recentlyPlayed = await get(recentlyPlayedAsyncAtom);
      let newRecentList = [...recentlyPlayed];

      if (action === "delete") {
        newRecentList = recentlyPlayed.filter(
          (reference) => !areTrackReferencesEqual(reference, data),
        );
      } else if (action === "rename") {
        newRecentList = recentlyPlayed.map((reference) => {
          if (!areTrackReferencesEqual(reference, data.old)) return reference;
          return data.latest;
        });
      }

      set(recentlyPlayedAsyncAtom, newRecentList);
    }

    // Synchronize track list.
    const playingMedia = await get(playingMediaAsyncAtom);
    const trackList = await get(trackListAsyncAtom);

    const newPlayingMedia = { ...playingMedia };
    let newTrackList = { ...trackList };

    const shouldResynchronizeTrackList =
      action === "update" && !data
        ? true
        : areTrackReferencesEqual(
            trackList.reference,
            action === "rename" ? data.old : data!,
          );

    if (shouldResynchronizeTrackList) {
      if (action === "delete") {
        newPlayingMedia.listIndex = 0;
        newTrackList = { data: [], reference: undefined };
      } else if (action === "update") {
        if (trackList.reference) {
          const newInfo = await refreshTrackListData({
            listSource: trackList.reference,
            shuffle: await get(shuffleAsyncAtom),
            startingTrack: playingMedia.id,
          });
          newPlayingMedia.listIndex = newInfo.listIndex;
          newTrackList.data = newInfo.trackList;
        }
      } else if (action === "rename") {
        newTrackList.reference = data.latest;
      }

      set(playingMediaAsyncAtom, newPlayingMedia);
      set(trackListAsyncAtom, newTrackList);
    }
  },
);
