import { shallow } from "zustand/shallow";

import { musicStore } from "./Music";
import { sortPreferencesStore, sortTracks } from "./SortPreferences";

import { ReservedPlaylists } from "../constants";

/*
  Where we put subscriptions to avoid require cycles.
*/

//#region Sort Preferences Store
/**
 * Update `playingList` whenever any of the states change when we're
 * playing all tracks.
 */
sortPreferencesStore.subscribe(
  (state) => ({ isAsc: state.isAsc, orderedBy: state.orderedBy }),
  () => {
    const { playingSource, listIdx, playingList, trackList, shuffle } =
      musicStore.getState();
    // Only trigger if we're playing all tracks.
    if (playingSource?.id !== ReservedPlaylists.tracks) return;
    const sortedPlayingList = sortTracks(trackList).map(({ id }) => id);
    // Compare if `playingList` is the same as `sortedPlayingList`.
    if (shallow(playingList, sortedPlayingList)) return;
    // We don't need to update `shuffledPlayingList` as order doesn't matter.
    const prevId = playingList[listIdx]!;
    const newListIdx = sortedPlayingList.findIndex((tId) => tId === prevId);
    musicStore.setState({
      playingList: sortedPlayingList,
      ...(!shuffle ? { listIdx: newListIdx } : {}),
    });
  },
  { equalityFn: shallow },
);
