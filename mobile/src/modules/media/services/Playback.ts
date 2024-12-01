import TrackPlayer from "react-native-track-player";

import { getTrack } from "@/api/track";
import {
  Queue,
  RecentList,
  RNTPManager,
  musicStore,
  resetState,
} from "./Music";

import {
  arePlaybackSourceEqual,
  getSourceName,
  getTrackList,
} from "../helpers/data";
import type { PlayListSource } from "../types";

//#region MusicControls
/**
 * Helpers wrapping around RNTP's functions that provides some special
 * behaviors.
 */
export class MusicControls {
  /** Play the current track. */
  static async play() {
    musicStore.setState({ isPlaying: true });
    await RNTPManager.preloadRNTPQueue();
    await TrackPlayer.play();
  }

  /** Pause the current playing track. */
  static async pause() {
    musicStore.setState({ isPlaying: false });
    await TrackPlayer.pause();
  }

  /** Stop & unload the current playing track (stops loading/buffering). */
  static async stop() {
    musicStore.setState({ isPlaying: false });
    await TrackPlayer.stop();
  }

  /** Toggle `isPlaying`, playing or pausing the current track. */
  static async playToggle() {
    if (musicStore.getState().isPlaying) await MusicControls.pause();
    else await MusicControls.play();
  }

  /** Play the previous track. */
  static async prev() {
    const { trackId, track, newIdx } = RNTPManager.getPrevTrack();
    // If no track is found, reset the state.
    if (track === undefined) return await resetState();

    // If the RNTP queue isn't loaded or if we played <=10s of the track,
    // simply update the `currPlayingIdx` & `currPlayingId`
    if (
      !(await RNTPManager.isRNTPLoaded()) ||
      (await TrackPlayer.getProgress()).position <= 10
    ) {
      musicStore.setState({
        activeId: trackId,
        activeTrack: track,
        listIdx: newIdx,
        isInQueue: false, // We're no longer in the queue if we go back.
      });
    }

    await RNTPManager.reloadCurrentTrack({ restart: true });
  }

  /** Play the next track. */
  static async next() {
    const shouldRepeat = musicStore.getState().repeat;
    const { trackId, track, newIdx, isInQueue } = RNTPManager.getNextTrack();
    musicStore.setState({
      activeId: trackId,
      activeTrack: track,
      ...(!isInQueue ? { listIdx: newIdx } : {}),
      isInQueue,
    });
    // Remove the track in the queue.
    if (isInQueue) await Queue.removeAtIndex(0);

    await RNTPManager.reloadCurrentTrack({ restart: true });
    if (newIdx === 0 && !shouldRepeat) await MusicControls.pause();
  }

  /** Seek to a certain position in the current playing track. */
  static async seekTo(position: number) {
    await RNTPManager.preloadRNTPQueue();
    await TrackPlayer.seekTo(position);
  }
}
//#endregion

//#region Play From Media List
/** Play a track from a media list. */
export async function playFromMediaList({
  source,
  trackId,
}: {
  source: PlayListSource;
  trackId?: string;
}) {
  const { shuffle, playingSource, activeId, activeTrack, currentTrackList } =
    musicStore.getState();

  // 1. See if we're playing from a new media list.
  const isSameSource = arePlaybackSourceEqual(playingSource, source);
  let isDiffTrack = activeId === undefined || activeId !== trackId;

  // 2. Handle case when we're playing from the same media list.
  if (isSameSource) {
    // Case where we play a different track in this media list.
    if (!!trackId && isDiffTrack) {
      // Find index of new track in list.
      const listIndex = currentTrackList.findIndex(({ id }) => id === trackId);
      musicStore.setState({
        activeId: trackId,
        activeTrack: currentTrackList[listIndex],
        listIdx: listIndex,
        isInQueue: false,
      });
      await RNTPManager.reloadCurrentTrack({ preload: true });
    }
    return await MusicControls.play(); // Will preload RNTP queue if empty.
  }

  // 3. Handle case when the media list is new.
  const newPlayingList = (await getTrackList(source)).map(({ id }) => id);
  if (newPlayingList.length === 0) return; // Don't do anything if list is empty.
  const { isInQueue: _, ...newListsInfo } = RNTPManager.getPlayingLists(
    newPlayingList,
    trackId ?? activeId,
  );

  // 4. Get the track from this new info.
  const newTrackId = shuffle
    ? newListsInfo.shuffledPlayingList[newListsInfo.listIdx]
    : newListsInfo.playingList[newListsInfo.listIdx];
  isDiffTrack = activeId !== newTrackId;
  let newTrack = activeTrack;
  if (isDiffTrack) {
    try {
      newTrack = await getTrack(newTrackId!);
    } catch {}
  }

  // 5. Update the persistent storage.
  musicStore.setState({
    isPlaying: true,
    ...newListsInfo,
    playingSource: source,
    sourceName: await getSourceName(source),
    ...(isDiffTrack ? { activeId: newTrackId, activeTrack: newTrack } : {}),
    // The `isInQueue` from `RNTPManager.getPlayingLists()` will return
    // `true` if you were playing from a different media list.
    isInQueue: false,
  });

  // 5. Play this new media list.
  await RNTPManager.reloadCurrentTrack({ preload: true });
  await TrackPlayer.play();

  // 6. Add media list to recent lists.
  RecentList.add(source);
}
//#endregion
