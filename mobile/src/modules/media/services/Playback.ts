import { atom, getDefaultStore } from "jotai";
import TrackPlayer from "react-native-track-player";

import {
  _currPlayListIdxAtom,
  _currTrackIdAtom,
  _playListAtom,
  _playListSourceAtom,
  _shuffleAtom,
} from "./Persistent";
import { arePlaybackSourceEqual, generatePlayList } from "../helpers/data";
import { preloadRNTPQueue } from "../helpers/preload";
import { replaceAroundTrack, replaceRNTPQueue } from "../helpers/rntp";
import type { PlayListSource } from "../types";

//#region Synchronous State
/** Synchronously determine if a track is playing. */
export const isPlayingAtom = atom(false);
//#endregion

//#region MusicControls
/**
 * Helpers wrapping around RNTP's functions that provides some special
 * behaviors.
 */
export class MusicControls {
  /** Play the current track. */
  static async play() {
    getDefaultStore().set(isPlayingAtom, true);
    await preloadRNTPQueue();
    await TrackPlayer.play();
  }

  /** Pause the current playing track. */
  static async pause() {
    getDefaultStore().set(isPlayingAtom, false);
    await TrackPlayer.pause();
  }

  /** Toggle `isPlaying`, playing or pausing the current track. */
  static async playToggle() {
    if (getDefaultStore().get(isPlayingAtom)) await MusicControls.pause();
    else await MusicControls.play();
  }

  /** Play the previous track. */
  static async prev() {
    await preloadRNTPQueue();
    const { position } = await TrackPlayer.getProgress();
    if (position > 10) {
      // Restart from the beginning of the current track if we've played
      // more than 10 seconds of the track.
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  }

  /** Play the next track. */
  static async next() {
    await preloadRNTPQueue();
    await TrackPlayer.skipToNext();
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
    const currSource = await get(_playListSourceAtom);
    const currTrackIds = await get(_playListAtom);
    const currTrackId = await get(_currTrackIdAtom);
    const currListIdx = await get(_currPlayListIdxAtom);
    const shouldShuffle = await get(_shuffleAtom);

    // 1. See if we're playing from a new media list.
    const isSameSource = arePlaybackSourceEqual(currSource, source);
    let isDiffTrack = currTrackId === undefined || currTrackId !== trackId;

    // 2. Handle case when we're playing from the same media list.
    if (isSameSource) {
      // Case where we play a different track in this media list.
      if (!!trackId && isDiffTrack) {
        // Find index of new track in list.
        const listIndex = currTrackIds.findIndex((tId) => tId === trackId);
        set(_currTrackIdAtom, trackId);
        set(_currPlayListIdxAtom, listIndex);
        await TrackPlayer.skip(listIndex);
      }
      await MusicControls.play(); // Will preload RNTP queue if empty.
      return;
    }

    // 3. Handle case when the media list is new.
    const { trackIndex, tracks } = await generatePlayList({
      source,
      shouldShuffle,
      // Either play from the selected track, the current playing track, or from the beginning.
      startTrackId: trackId ?? currTrackId,
    });
    if (tracks.length === 0) return; // Don't do anything if list is empty.

    // 4. Update the persistent storage.
    const newTrack = tracks[trackIndex]!;
    set(_currTrackIdAtom, newTrack.id);
    set(_currPlayListIdxAtom, trackIndex);
    set(_playListSourceAtom, source);
    set(
      _playListAtom,
      tracks.map(({ id }) => id),
    );

    // 5. Play this new media list.
    isDiffTrack = currTrackId !== newTrack.id;
    set(isPlayingAtom, true);
    if (isDiffTrack) {
      await replaceRNTPQueue({
        tracks,
        startIndex: trackIndex,
        shouldPlay: true,
      });
    } else {
      await replaceAroundTrack({
        tracks,
        oldIndex: currListIdx,
        newIndex: trackIndex,
        shouldPlay: true,
      });
    }
  },
);
//#endregion
