import { atom } from "jotai";
import TrackPlayer from "react-native-track-player";

import {
  AsyncAtomState,
  RecentList,
  RNTPManager,
  SyncAtomState,
  resetState,
} from "./State";

import { getAtom, setAtom } from "@/lib/jotai";
import { shuffleArray } from "@/utils/object";
import { arePlaybackSourceEqual, getTrackList } from "../helpers/data";
import { preloadRNTPQueue } from "../helpers/preload";
import type { PlayListSource } from "../types";

//#region MusicControls
/**
 * Helpers wrapping around RNTP's functions that provides some special
 * behaviors.
 */
export class MusicControls {
  /** Play the current track. */
  static async play() {
    setAtom(SyncAtomState.isPlaying, true);
    await preloadRNTPQueue();
    await TrackPlayer.play();
  }

  /** Pause the current playing track. */
  static async pause() {
    setAtom(SyncAtomState.isPlaying, false);
    await TrackPlayer.pause();
  }

  /** Stop & unload the current playing track (stops loading/buffering). */
  static async stop() {
    setAtom(SyncAtomState.isPlaying, false);
    await TrackPlayer.stop();
  }

  /** Toggle `isPlaying`, playing or pausing the current track. */
  static async playToggle() {
    if (getAtom(SyncAtomState.isPlaying)) await MusicControls.pause();
    else await MusicControls.play();
  }

  /** Play the previous track. */
  static async prev() {
    const playingList = await getAtom(AsyncAtomState.playingList);
    // If we have no tracks in `playlingList`, reset the state.
    if (playingList.length === 0) {
      await resetState();
      return;
    }

    // If the RNTP queue isn't loaded or if we played <=10s of the track,
    // simply update the `currPlayingIdx` & `currPlayingId`
    if (
      !(await RNTPManager.isRNTPLoaded()) ||
      (await TrackPlayer.getProgress()).position <= 10
    ) {
      // We're no longer in the queue if we go back.
      await setAtom(AsyncAtomState.isInQueue, false);
      await setAtom(AsyncAtomState.currPlayingIdx, async (_prevIdx) => {
        const prevIdx = await _prevIdx;
        return prevIdx === 0 ? playingList.length - 1 : prevIdx - 1;
      });
      await setAtom(
        AsyncAtomState.currPlayingId,
        await RNTPManager.getTrackAroundCurrIdx("BEFORE"),
      );
      return;
    }

    await RNTPManager.reloadCurrentTrack();
  }

  /** Play the next track. */
  static async next() {
    // If the RNTP queue is loaded, simply play the next track as we load
    // the first 2 tracks in the RNTP queue.
    if (await RNTPManager.isRNTPLoaded()) {
      await TrackPlayer.skipToNext();
      return;
    }

    const { isNextInQueue, nextTrackId } = await RNTPManager.getNextTrack();
    await setAtom(AsyncAtomState.isInQueue, isNextInQueue);
    if (isNextInQueue) {
      await setAtom(AsyncAtomState.queueList, async (prev) => [
        ...(await prev).slice(1),
      ]);
    }
    await setAtom(AsyncAtomState.currPlayingId, nextTrackId);

    if (!isNextInQueue) {
      const playingList = await getAtom(AsyncAtomState.playingList);
      await setAtom(AsyncAtomState.currPlayingIdx, async (_prevIdx) => {
        const prevIdx = await _prevIdx;
        return prevIdx === playingList.length - 1 ? 0 : prevIdx + 1;
      });
    }
  }

  /** Seek to a certain position in the current playing track. */
  static async seekTo(position: number) {
    await preloadRNTPQueue();
    await TrackPlayer.seekTo(position);
  }
}
//#endregion

//#region Play From Media List
/** Play a track from a media list. */
export const playFromMediaListAtom = atom(
  null,
  async (
    get,
    set,
    { source, trackId }: { source: PlayListSource; trackId?: string },
  ) => {
    const currSource = await get(AsyncAtomState.playingSource);
    const currTrackIds = await get(AsyncAtomState.currentList);
    const currTrackId = await get(AsyncAtomState.currPlayingId);
    const shouldShuffle = await get(AsyncAtomState.shuffle);

    // 1. See if we're playing from a new media list.
    const isSameSource = arePlaybackSourceEqual(currSource, source);
    let isDiffTrack = currTrackId === undefined || currTrackId !== trackId;

    // 2. Handle case when we're playing from the same media list.
    if (isSameSource) {
      // Case where we play a different track in this media list.
      if (!!trackId && isDiffTrack) {
        // Find index of new track in list.
        const listIndex = currTrackIds.findIndex((tId) => tId === trackId);
        await set(AsyncAtomState.isInQueue, false);
        await set(AsyncAtomState.currPlayingId, trackId);
        await set(AsyncAtomState.currPlayingIdx, listIndex);
        await RNTPManager.reloadCurrentTrack();
      }
      await MusicControls.play(); // Will preload RNTP queue if empty.
      return;
    }

    // 3. Handle case when the media list is new.
    const newUnshuffled = (await getTrackList(source)).map(({ id }) => id);
    if (newUnshuffled.length === 0) return; // Don't do anything if list is empty.
    const newShuffled = shuffleArray(newUnshuffled);

    const _newIndex = RNTPManager.getIdxFromTrackId(
      await RNTPManager.getTrackAroundCurrIdx("AT"),
      shouldShuffle ? newShuffled : newUnshuffled,
    );
    const newIndex = _newIndex === -1 ? 0 : _newIndex;

    // 4. Update the persistent storage.
    await set(AsyncAtomState.isInQueue, false);
    await set(AsyncAtomState.playingSource, source);
    await set(AsyncAtomState.playingList, newUnshuffled);
    await set(AsyncAtomState.shuffledPlayingList, newShuffled);
    await set(AsyncAtomState.currPlayingIdx, newIndex);

    const newTrackId = shouldShuffle
      ? newShuffled[newIndex]!
      : newUnshuffled[newIndex]!;
    isDiffTrack = currTrackId !== newTrackId;
    if (isDiffTrack) await set(AsyncAtomState.currPlayingId, newTrackId);

    // 5. Play this new media list.
    set(SyncAtomState.isPlaying, true);
    await RNTPManager.reloadCurrentTrack();
    await TrackPlayer.play();

    // 6. Add media list to recent lists.
    await RecentList.add(source);
  },
);
//#endregion
