import { RNTPManager, musicStore } from "./Music";
import { RecentList } from "./RecentList";

import {
  arePlaybackSourceEqual,
  getSourceName,
  getTrackList,
} from "../helpers/data";
import type { PlayListSource } from "../types";

/**
 * Helpers to ensure the Zustand store is up-to-date with the changes made
 * in React Query.
 */
export class Resynchronize {
  /** Resynchronize when we delete one or more media lists. */
  static async onDelete(removedRefs: PlayListSource | PlayListSource[]) {
    if (Array.isArray(removedRefs)) RecentList.removeEntries(removedRefs);
    else RecentList.removeEntries([removedRefs]);
    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;
    // If we're playing a list we've deleted, reset the state.
    const isPlayingRef = Array.isArray(removedRefs)
      ? RecentList.isInRecentList(currSource, removedRefs)
      : arePlaybackSourceEqual(currSource, removedRefs);
    if (isPlayingRef) await musicStore.getState().reset();
  }

  /** Resynchronize when we update the artwork. */
  static onImage() {
    RecentList.refresh();
  }

  /** Resynchronize when we rename a playlist. */
  static onRename({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    RecentList.replaceEntry({ oldSource, newSource });
    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;
    // Update `playingSource` if we renamed that source.
    const isPlayingRef = arePlaybackSourceEqual(currSource, oldSource);
    if (isPlayingRef) {
      getSourceName(newSource).then((newName) =>
        musicStore.setState({ playingSource: newSource, sourceName: newName }),
      );
    }
  }

  /** Resynchronize when we update the tracks in a media list. */
  static async onTracks(ref: PlayListSource) {
    RecentList.refresh();
    // Check if we were playing this list.
    const { playingSource } = musicStore.getState();
    const isPlayingRef = arePlaybackSourceEqual(playingSource, ref);
    if (!isPlayingRef) return;
    // Make sure our track lists along with the current index are up-to-date.
    const newPlayingList = (await getTrackList(ref)).map(({ id }) => id);
    const newListsInfo = RNTPManager.getUpdatedLists(newPlayingList, {
      contextAware: true,
    });
    musicStore.setState({ ...newListsInfo });
    // Make sure the next track is correct after updating the list used.
    await RNTPManager.reloadNextTrack();
  }

  /** Resynchronize if we discovered new tracks in the current playing list. */
  static async onUpdatedList(newIds: string[]) {
    if (newIds.length === 0) return;
    const currSource = musicStore.getState().playingSource;
    if (currSource === undefined) return;
    // See if the playling list has any of the specified tracks.
    const hasUnstagedTrack = (await getTrackList(currSource)).some(
      ({ id: tId }) => newIds.includes(tId),
    );
    if (hasUnstagedTrack) await Resynchronize.onTracks(currSource);
  }
}
