import TrackPlayer from "@weights-ai/react-native-track-player";

import { addPlayedMediaList } from "~/api/recent";
import { getTrack } from "~/api/track";
import { userPreferencesStore } from "~/services/UserPreferences";
import { Queue, RNTPManager, musicStore } from "./Music";

import { revalidateWidgets } from "~/modules/widget/utils";
import {
  arePlaybackSourceEqual,
  getSourceName,
  getTrackList,
} from "../helpers/data";
import type { PlayListSource } from "../types";

type PlayPauseOptions = {
  /** If we shouldn't revalidate widgets when playback state changes. */
  noRevalidation?: boolean;
};

//#region MusicControls
/**
 * Helpers wrapping around RNTP's functions that provides some special
 * behaviors.
 */
export class MusicControls {
  /** Play the current track. */
  static async play(opts?: PlayPauseOptions) {
    musicStore.setState({ isPlaying: true });
    await RNTPManager.preload();
    await TrackPlayer.play();
    if (!opts?.noRevalidation) revalidateWidgets();
  }

  /** Pause the current playing track. */
  static async pause(opts?: PlayPauseOptions) {
    musicStore.setState({ isPlaying: false });
    await TrackPlayer.pause();
    if (!opts?.noRevalidation) revalidateWidgets();
  }

  /** Stop & unload the current playing track (stops loading/buffering). */
  static async stop() {
    musicStore.setState({ isPlaying: false });
    await TrackPlayer.stop();
    revalidateWidgets({ openApp: true });
  }

  /** Toggle `isPlaying`, playing or pausing the current track. */
  static async playToggle(opts?: PlayPauseOptions) {
    if (musicStore.getState().isPlaying) await MusicControls.pause(opts);
    else await MusicControls.play(opts);
  }

  /** Play the previous track. */
  static async prev() {
    const prevTrack = await RNTPManager.getPrevTrack();
    // If no track is found, reset the state.
    if (prevTrack.activeTrack === undefined) {
      return await musicStore.getState().reset();
    }

    // If the RNTP queue isn't loaded or if we played <=10s of the track,
    // simply update the `currPlayingIdx` & `currPlayingId`
    if (
      !(await RNTPManager.isLoaded()) ||
      (await TrackPlayer.getProgress()).position <= 10
    ) {
      musicStore.setState({ ...prevTrack, ...shouldChangeRepeatMode() });
    }

    await RNTPManager.reloadCurrentTrack({ restart: true });
  }

  /** Play the next track. */
  static async next() {
    const repeatMode = musicStore.getState().repeat;
    const { listIdx, ...nextTrack } = await RNTPManager.getNextTrack();
    // Make sure we reset if we play from a source with no tracks left.
    if (!nextTrack.activeId) return await musicStore.getState().reset();
    musicStore.setState({
      ...nextTrack,
      ...(!nextTrack.isInQueue ? { listIdx } : {}),
      ...shouldChangeRepeatMode(),
    });
    // Remove the track in the queue.
    if (nextTrack.isInQueue) await Queue.removeAtIndex(0);

    await RNTPManager.reloadCurrentTrack({ restart: true });
    if (listIdx === 0 && repeatMode === "no-repeat") {
      await MusicControls.pause();
    }
  }

  /** Seek to a certain position in the current playing track. */
  static async seekTo(position: number) {
    await RNTPManager.preload();
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
  const { shuffle, playingSource, activeId, activeTrack, currentList } =
    musicStore.getState();

  // 1. See if we're playing from a new media list.
  const isSameSource = arePlaybackSourceEqual(playingSource, source);
  let isDiffTrack = activeId === undefined || activeId !== trackId;

  // 2. Handle case when we're playing from the same media list.
  if (isSameSource) {
    // Case where we play a different track in this media list.
    if (!!trackId && isDiffTrack) {
      // Find index of new track in list (let the `activeId` subscription
      // handle updating `activeTrack`).
      const listIndex = currentList.findIndex((id) => id === trackId);
      musicStore.setState({
        activeId: trackId,
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
  const { isInQueue: _, ...newListsInfo } = RNTPManager.getUpdatedLists(
    newPlayingList,
    { startTrackId: trackId ?? activeId },
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
    // The `isInQueue` from `RNTPManager.getUpdatedLists()` will return
    // `true` if you were playing from a different media list.
    isInQueue: false,
  });

  // 5. Play this new media list.
  await RNTPManager.reloadCurrentTrack({ preload: true });
  await TrackPlayer.play();

  // 6. Add media list to recent lists.
  await addPlayedMediaList(source);
}
//#endregion

//#region Internal Helper
/** Determines if we should switch the repeat mode to "repeat" from "repeat-one". */
function shouldChangeRepeatMode() {
  const { repeat } = musicStore.getState();
  const { repeatOnSkip } = userPreferencesStore.getState();
  if (repeat === "repeat-one" && !repeatOnSkip) {
    return { repeat: "repeat" } as const;
  } else {
    return {};
  }
}
//#endregion
