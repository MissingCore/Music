import { atom } from "jotai";

import { recentlyPlayedAsyncAtom } from "./recent";
import type { TrackListSource } from "../types";
import { areTrackReferencesEqual } from "../utils";

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
  },
);
