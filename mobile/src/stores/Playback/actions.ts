import TrackPlayer, { State } from "@weights-ai/react-native-track-player";

import { addPlayedMediaList } from "~/api/recent";
import { userPreferencesStore } from "~/services/UserPreferences";

import type { RepeatMode } from "./constants";
import { RepeatModes } from "./constants";
import { playbackStore } from "./store";

import { shuffleArray } from "~/utils/object";
import type { PlayListSource } from "~/modules/media/types";
import {
  arePlaybackSourceEqual,
  getSourceName,
  getTrackList,
  formatTrackforPlayer,
} from "~/modules/media/helpers/data";
import { revalidateWidgets } from "~/modules/widget/utils";

//#region Setting Changes
/** Switch to the next repeat mode. */
export async function cycleRepeat() {
  const { repeat } = playbackStore.getState();
  let newMode: RepeatMode = RepeatModes.REPEAT;
  if (repeat === RepeatModes.REPEAT) newMode = RepeatModes.REPEAT_ONE;
  else if (repeat === RepeatModes.REPEAT_ONE) newMode = RepeatModes.NO_REPEAT;
  playbackStore.setState({ repeat: newMode });
}

/** Update the `shuffle` field along with `currentList` & `listIdx`. */
export async function toggleShuffle() {
  const { shuffle, orderSnapshot, queue, activeId } = playbackStore.getState();
  const newShuffleStatus = !shuffle;

  // Exit early if we don't have a list loaded.
  if (queue.length === 0 || !activeId) {
    playbackStore.setState({ shuffle: newShuffleStatus });
    return;
  }

  let updatedQueue: string[] = [];
  if (newShuffleStatus) updatedQueue = shuffleArray(queue);
  else {
    // Re-order tracks to match `orderSnapshot`, and then append the rest
    // at the end.
    const queueCopy = [...queue];
    orderSnapshot.forEach((trackId) => {
      const atIndex = queueCopy.findIndex((id) => trackId === id);
      if (atIndex !== -1) {
        updatedQueue.push(trackId);
        queueCopy.splice(atIndex, 1);
      }
    });
    updatedQueue.concat(queueCopy);
  }

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    queuePosition: updatedQueue.findIndex((id) => id === activeId),
  });
}
//#endregion

//#region Playback Actions
/** Loads the track specified by `activeTrack`. Track will start at `0s`. */
export async function loadCurrentTrack() {
  const { activeTrack } = playbackStore.getState();
  if (!activeTrack) return;
  await TrackPlayer.load(formatTrackforPlayer(activeTrack));
}

/** Initialize the RNTP queue. */
export async function preloadCurrentTrack() {
  if (await isLoaded()) return;
  console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
  await loadCurrentTrack();
}

type PlayPauseOptions = {
  /** If we shouldn't revalidate widgets when playback state changes. */
  noRevalidation?: boolean;
};

/** Play the current track. */
export async function play(opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: true });
  await preloadCurrentTrack();
  await TrackPlayer.play();
  if (!opts?.noRevalidation) revalidateWidgets({ exclude: ["ArtworkPlayer"] });
}

/** Pause the current playing track. */
export async function pause(opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: false });
  await TrackPlayer.pause();
  if (!opts?.noRevalidation) revalidateWidgets({ exclude: ["ArtworkPlayer"] });
}

/** Stop & unload the current playing track (stops loading/buffering). */
export async function stop() {
  playbackStore.setState({ isPlaying: false });
  await TrackPlayer.stop();
  revalidateWidgets({ openApp: true });
}

/** Toggle `isPlaying`, playing or pausing the current track. */
export async function playToggle(opts?: PlayPauseOptions) {
  if (playbackStore.getState().isPlaying) await pause(opts);
  else await play(opts);
}

/** Loads the track before `queuePosition`. */
export async function prev() {
  const { getTrack, reset, queue, queuePosition } = playbackStore.getState();

  const prevIndex = queuePosition === 0 ? queue.length - 1 : queuePosition - 1;
  const prevTrackId = queue[prevIndex];
  if (!prevTrackId) return await reset();
  // If no track is found, reset the state.
  const prevTrack = await getTrack(prevTrackId);
  if (!prevTrack) return;

  // If the RNTP queue isn't loaded or if we played <=10s of the track,
  // simply update the `currPlayingIdx` & `currPlayingId`
  if (!(await isLoaded()) || (await TrackPlayer.getProgress()).position <= 10) {
    playbackStore.setState({
      activeId: prevTrack.id,
      activeTrack: prevTrack,
      queuePosition: prevIndex,
      ...getNewRepeatState(),
    });
  }

  await loadCurrentTrack();
}

/** Loads the track after `queuePosition`. */
export async function next(naturalProgression = false) {
  const { getTrack, reset, repeat, queue, queuePosition } =
    playbackStore.getState();

  const nextIndex = queuePosition === queue.length - 1 ? 0 : queuePosition + 1;
  const nextTrackId = queue[nextIndex];
  if (!nextTrackId) return await reset();
  // If no track is found, reset the state.
  const nextTrack = await getTrack(nextTrackId);
  if (!nextTrack) return;

  playbackStore.setState({
    activeId: nextTrack.id,
    activeTrack: nextTrack,
    queuePosition: nextIndex,
    // Only update repeate state if we explictly click the next button.
    ...(naturalProgression ? {} : getNewRepeatState()),
  });

  if (nextIndex === 0 && repeat === RepeatModes.NO_REPEAT) await pause();
  await loadCurrentTrack();
}

/** Seek to a certain position in the current playing track. */
export async function seekTo(position: number) {
  await preloadCurrentTrack();
  await TrackPlayer.seekTo(position);
}

/** Play a track from a media list. */
export async function playFromList({
  source,
  trackId,
}: {
  source: PlayListSource;
  trackId?: string;
}) {
  const { getTrack, playingFrom, queue, activeId } = playbackStore.getState();

  // 1. See if we're playing from a new media list.
  const isSameSource = arePlaybackSourceEqual(playingFrom, source);
  let isDiffTrack = activeId === undefined || activeId !== trackId;

  // 2. Handle case when we're playing from the same media list.
  if (isSameSource) {
    handleSameSource: {
      // Case where we play a different track in this media list.
      if (!!trackId && isDiffTrack) {
        // Find index of new track in list.
        const listIndex = queue.findIndex((id) => id === trackId);
        // If it doesn't exist, then reset the current queue.
        if (listIndex === -1) break handleSameSource;
        playbackStore.setState({
          activeId: trackId,
          activeTrack: (await getTrack(trackId))!,
          queuePosition: listIndex,
        });
        await loadCurrentTrack();
      }
      return await play(); // Will preload RNTP queue if empty.
    }
  }

  // 3. Handle case when the media list is new.
  const newPlayingList = await getTrackList(source);
  if (newPlayingList.length === 0) return; // Don't do anything if list is empty.
  const newListInfo = getUpdatedLists(
    newPlayingList.map(({ id }) => id),
    trackId ?? activeId,
  );

  // 4. Get the track from this new info.
  const newTrack = newPlayingList[newListInfo.queuePosition]!;
  newTrack.artwork = newTrack.artwork ?? newTrack.album?.artwork ?? null;
  isDiffTrack = activeId !== newTrack.id;

  // 5. Update the persistent storage.
  playbackStore.setState({
    isPlaying: true,
    ...newListInfo,
    playingFrom: source,
    playingFromName: await getSourceName(source),
    activeId: newTrack.id,
    activeTrack: newTrack,
  });

  // 6. Play this new media list.
  if (isDiffTrack) await loadCurrentTrack();
  await TrackPlayer.play();

  // 7. Add media list to recent lists.
  await addPlayedMediaList(source);
}
//#endregion

//#region Internal Util Copies
/** Determines if we should switch the repeat mode to "repeat" from "repeat-one". */
function getNewRepeatState() {
  const { repeat } = playbackStore.getState();
  const { repeatOnSkip } = userPreferencesStore.getState();
  if (repeat === RepeatModes.REPEAT_ONE && !repeatOnSkip) {
    return { repeat: RepeatModes.REPEAT } as const;
  } else {
    return {};
  }
}

/** Determine if any tracks are loaded in RNTP on launch. */
async function isLoaded() {
  try {
    return (await TrackPlayer.getPlaybackState()).state !== State.None;
  } catch {
    return false;
  }
}

/** Returns information necessary to switch `queue` seamlessly. */
function getUpdatedLists(newPlayingList: string[], startTrackId?: string) {
  const { shuffle, activeId } = playbackStore.getState();
  const usedList = shuffle ? shuffleArray(newPlayingList) : newPlayingList;

  // The tracks we should attempt to start from.
  const startFromIds = [startTrackId, activeId];
  // Get the index we should start at in the new list.
  let newLocation = -1;
  startFromIds.forEach((startId) => {
    if (!startId || newLocation !== -1) return;
    newLocation = usedList.findIndex((tId) => startId === tId);
  });

  return {
    orderSnapshot: newPlayingList,
    queue: usedList,
    queuePosition: newLocation === -1 ? 0 : newLocation,
  };
}
//#endregion
