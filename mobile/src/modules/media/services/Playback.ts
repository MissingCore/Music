import { atom } from "jotai";
import TrackPlayer from "react-native-track-player";

import { _playListRefAtom, _playViewRefAtom, _shuffleAtom } from "./Persistent";
import { arePlaybackSourceEqual, generatePlayList } from "../helpers/data";
import { preloadRNTPQueue } from "../helpers/preload";
import { replaceAroundTrack, replaceRNTPQueue } from "../helpers/rntp";
import type { PlayListSource } from "../types";

//#region Synchronous State
/** Synchronously determine if a track is playing. */
export const isPlayingAtom = atom(false);
//#endregion

//#region Play
/** Play the current track. */
export const playAtom = atom(null, async (_, set) => {
  set(isPlayingAtom, true);
  await preloadRNTPQueue();
  await TrackPlayer.play();
});
//#endregion

//#region Pause
/** Pause the current playing track. */
export const pauseAtom = atom(null, async (_, set) => {
  set(isPlayingAtom, false);
  await TrackPlayer.pause();
});
//#endregion

//#region Play/Pause Toggle
/** Toggle `isPlaying`, playing or pausing the current track. */
export const playToggleAtom = atom(null, async (get, set) => {
  if (get(isPlayingAtom)) set(pauseAtom);
  else set(playAtom);
});
//#endregion

//#region Prev
/** Play the previous track. */
export const prevAtom = atom(null, async () => {
  await preloadRNTPQueue();
  const { position } = await TrackPlayer.getProgress();
  if (position > 10) {
    // Restart from the beginning of the current track if we've played
    // more than 10 seconds of the track.
    await TrackPlayer.seekTo(0);
  } else {
    await TrackPlayer.skipToPrevious();
  }
});
//#endregion

//#region Next
/** Play the next track. */
export const nextAtom = atom(null, async () => {
  await preloadRNTPQueue();
  await TrackPlayer.skipToNext();
});
//#endregion

//#region Seek
/** Seek to a certain position in the current playing track. */
export const seekAtom = atom(null, async (_get, _set, position: number) => {
  await preloadRNTPQueue();
  await TrackPlayer.seekTo(position);
});
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
    const currPlayList = await get(_playListRefAtom);
    const currPlayView = await get(_playViewRefAtom);
    const shouldShuffle = await get(_shuffleAtom);

    // 1. See if we're playing from a new media list.
    const isSameSource = arePlaybackSourceEqual(currPlayList.source, source);
    let isDiffTrack =
      currPlayView.id === undefined || currPlayView.id !== trackId;

    // 2. Handle case when we're playing from the same media list.
    if (isSameSource) {
      // Case where we play a different track in this media list.
      if (!!trackId && isDiffTrack) {
        // Find index of new track in list.
        const listIndex = currPlayList.trackIds.findIndex(
          (tId) => tId === trackId,
        );
        await set(_playViewRefAtom, { id: trackId, listIndex });
        await TrackPlayer.skip(listIndex);
      }
      await set(playAtom); // Will preload RNTP queue if empty.
      return;
    }

    // 3. Handle case when the media list is new.
    const { trackIndex, tracks } = await generatePlayList({
      source,
      shouldShuffle,
      // Either play from the selected track, the current playing track, or from the beginning.
      startTrackId: trackId ?? currPlayView.id,
    });
    if (tracks.length === 0) return; // Don't do anything if list is empty.

    // 4. Update the persistent storage.
    const newTrack = tracks[trackIndex]!;
    set(_playViewRefAtom, { id: newTrack.id, listIndex: trackIndex });
    set(_playListRefAtom, { source, trackIds: tracks.map(({ id }) => id) });

    // 5. Play this new media list.
    isDiffTrack = currPlayView.id !== newTrack.id;
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
        oldIndex: currPlayView.listIndex,
        newIndex: trackIndex,
        shouldPlay: true,
      });
    }
  },
);
//#endregion
