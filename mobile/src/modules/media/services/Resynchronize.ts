import { removePlayedMediaList, updatePlayedMediaList } from "~/api/recent";
import { RNTPManager, musicStore } from "./Music";

import {
  arePlaybackSourceEqual,
  getSourceName,
  getTrackList,
  isPlaybackSourceInList,
} from "../helpers/data";
import type { PlayListSource } from "../types";

/**
 * Helpers to ensure the Zustand store is up-to-date with the changes made
 * in React Query.
 */
export class Resynchronize {
  /** Resynchronize when we delete one or more media lists. */
  static async onDelete(removedRefs: PlayListSource | PlayListSource[]) {
    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;
    const isPlayingRef = Array.isArray(removedRefs)
      ? isPlaybackSourceInList(currSource, removedRefs)[0]
      : arePlaybackSourceEqual(currSource, removedRefs);
    // If we're playing a list we've deleted, reset the state.
    if (isPlayingRef) await musicStore.getState().reset();
  }

  /** Resynchronize when we rename a playlist. */
  static async onRename({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    try {
      await updatePlayedMediaList({ oldSource, newSource });
    } catch {
      // This means `newSource` already exists in the Recent List, so
      // just delete `oldSource`.
      await removePlayedMediaList(oldSource);
    }
    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    const isPlayingRef = arePlaybackSourceEqual(currSource, oldSource);
    // Update `playingSource` if we renamed that source.
    if (isPlayingRef) {
      const newName = await getSourceName(newSource);
      musicStore.setState({ playingSource: newSource, sourceName: newName });
    }
  }

  /** Resynchronize when we update the tracks in a media list. */
  static async onTracks(ref: PlayListSource) {
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
    if (!currSource) return;
    // See if the playling list has any of the specified tracks.
    const hasUnstagedTrack = (await getTrackList(currSource)).some(
      ({ id: tId }) => newIds.includes(tId),
    );
    if (hasUnstagedTrack) await Resynchronize.onTracks(currSource);
  }
}
