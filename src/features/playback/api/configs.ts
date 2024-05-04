import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { playingMediaAsyncAtom, trackListAsyncAtom } from "./track";
import { refreshTrackListData } from "../utils";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const repeatAsyncAtom = createAtomWithStorage("repeat", false);
/** @description Automatically play from the start of the track list. */
export const repeatAtom = unwrap(repeatAsyncAtom, (prev) => prev ?? false);

/** @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
const shuffleUnwrapAtom = unwrap(shuffleAsyncAtom, (prev) => prev ?? false);
/** @description If the next track should be "random". */
export const shuffleAtom = atom(
  (get) => get(shuffleUnwrapAtom),
  async (get, set) => {
    const newShuffleStatus = !(await get(shuffleAsyncAtom));
    const playingMedia = await get(playingMediaAsyncAtom);
    const currentTrackList = await get(trackListAsyncAtom);

    if (currentTrackList.reference) {
      const { listIndex, trackList } = await refreshTrackListData({
        listSource: currentTrackList.reference,
        shuffle: newShuffleStatus,
        startingTrack: playingMedia.id,
      });

      set(playingMediaAsyncAtom, { ...playingMedia, listIndex });
      set(trackListAsyncAtom, { ...currentTrackList, data: trackList });
    }

    set(shuffleAsyncAtom, newShuffleStatus);
  },
);
