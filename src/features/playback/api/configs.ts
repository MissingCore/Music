import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { playingInfoAsyncAtom } from "./playing";
import { getTrackList, shuffle } from "../utils/trackList";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description [FOR INTERNAL USE ONLY] */
export const repeatAsyncAtom = createAtomWithStorage("repeat", false);
/** @description If we should loop after reaching the end of the track list. */
export const repeatAtom = unwrap(repeatAsyncAtom, (prev) => prev ?? false);

/** @description [FOR INTERNAL USE ONLY] */
export const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
const shuffleUnwrapAtom = unwrap(shuffleAsyncAtom, (prev) => prev ?? false);
/** @description If the next track should be "random". */
export const shuffleAtom = atom(
  (get) => get(shuffleUnwrapAtom),
  async (get, set) => {
    const currShuffleStatus = await get(shuffleAsyncAtom);
    const currPlayingInfo = await get(playingInfoAsyncAtom);

    if (currPlayingInfo.listSrc) {
      let newTrackList = await getTrackList(currPlayingInfo.listSrc);
      if (!currShuffleStatus) newTrackList = shuffle(newTrackList);
      const newIdx = newTrackList.findIndex(
        (id) => id === currPlayingInfo.trackId,
      )!;

      set(playingInfoAsyncAtom, {
        ...currPlayingInfo,
        trackList: newTrackList,
        trackIdx: newIdx,
      });
    }

    set(shuffleAsyncAtom, !currShuffleStatus);
  },
);
