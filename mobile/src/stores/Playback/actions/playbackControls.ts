import TrackPlayer, { State } from "@weights-ai/react-native-track-player";

import { getAlbum } from "~/api/album";
import { getArtist } from "~/api/artist";
import { getFolderTracks } from "~/api/folder";
import { getPlaylist, getSpecialPlaylist } from "~/api/playlist";
import { addPlayedMediaList } from "~/api/recent";
import { userPreferencesStore } from "~/services/UserPreferences";

import { playbackStore } from "../store";
import { RepeatModes } from "../constants";
import type { PlayFromSource } from "../types";
import {
  arePlaybackSourceEqual,
  getSourceName,
  formatTrackforPlayer,
} from "../utils";

import { shuffleArray } from "~/utils/object";
import type { ReservedPlaylistName } from "~/modules/media/constants";
import { ReservedNames } from "~/modules/media/constants";
import { revalidateWidgets } from "~/modules/widget/utils";

//#region Loaders
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
//#endregion

//#region Media Controls
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
  const { getTrack, reset, lastPosition, queue, queuePosition } =
    playbackStore.getState();

  const prevIndex = queuePosition === 0 ? queue.length - 1 : queuePosition - 1;
  const prevTrackId = queue[prevIndex];
  if (!prevTrackId) return await reset();
  // If no track is found, reset the state.
  const prevTrack = await getTrack(prevTrackId);
  if (!prevTrack) return;

  // If the RNTP queue isn't loaded or if we played <=10s of the track,
  // simply update the `currPlayingIdx` & `currPlayingId`
  if (lastPosition <= 10 || !(await isLoaded())) {
    playbackStore.setState({
      lastPosition: 0,
      activeId: prevTrack.id,
      activeTrack: prevTrack,
      queuePosition: prevIndex,
      ...getNewRepeatState(),
    });
  } else {
    playbackStore.setState({ lastPosition: 0 });
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
    lastPosition: 0,
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
  playbackStore.setState({ lastPosition: position });
  await TrackPlayer.seekTo(position);
}

/** Play track at specified index in queue. */
export async function playAtIndex(index: number) {
  const { getTrack, reset, queue } = playbackStore.getState();

  const nextTrackId = queue[index];
  if (!nextTrackId) return await reset();
  // If no track is found, reset the state.
  const nextTrack = await getTrack(nextTrackId);
  if (!nextTrack) return;

  playbackStore.setState({
    lastPosition: 0,
    activeId: nextTrack.id,
    activeTrack: nextTrack,
    queuePosition: index,
    ...getNewRepeatState(),
  });

  await loadCurrentTrack();
  await play();
}

/** Play a track from a media list. */
export async function playFromList({
  source,
  trackId,
}: {
  source: PlayFromSource;
  trackId?: string;
}) {
  const { getTrack, playingFrom, queue, activeId, activeTrack } =
    playbackStore.getState();

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
  const newPlayingList = await getTrackIdsList(source);
  if (newPlayingList.length === 0) return; // Don't do anything if list is empty.
  const newListInfo = getUpdatedLists(newPlayingList, trackId ?? activeId);

  // 4. Get the track from this new info.
  const newTrackId = newListInfo.queue[newListInfo.queuePosition]!;
  isDiffTrack = activeId !== newTrackId;
  let newTrack = activeTrack;
  if (isDiffTrack) newTrack = await getTrack(newTrackId);

  // 5. Update the persistent storage.
  playbackStore.setState({
    isPlaying: true,
    ...newListInfo,
    playingFrom: source,
    playingFromName: await getSourceName(source),
    activeId: newTrackId,
    activeTrack: newTrack,
  });

  // 6. Play this new media list.
  if (isDiffTrack || !(await isLoaded())) await loadCurrentTrack();
  TrackPlayer.play();

  // 7. Add media list to recent lists.
  addPlayedMediaList(source);
}
//#endregion

//#region Internal Utils
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

/** Get list of tracks ids from a `PlayFromSource`. */
async function getTrackIdsList({ type, id }: PlayFromSource) {
  let trackIds: string[] = [];

  try {
    if (type === "album") {
      const data = await getAlbum(id, {
        columns: [],
        trackColumns: ["id"],
      });
      trackIds = data.tracks.map(({ id }) => id);
    } else if (type === "artist") {
      const data = await getArtist(id, {
        columns: [],
        trackColumns: ["id"],
        withAlbum: false,
      });
      trackIds = data.tracks.map(({ id }) => id);
    } else if (type === "folder") {
      const data = await getFolderTracks(id); // `id` contains pathname.
      trackIds = data.map(({ id }) => id);
    } else {
      if (ReservedNames.has(id)) {
        const data = await getSpecialPlaylist(id as ReservedPlaylistName, {
          columns: [],
          trackColumns: ["id"],
          withAlbum: false,
        });
        trackIds = data.tracks.map(({ id }) => id);
      } else {
        const data = await getPlaylist(id, {
          columns: [],
          trackColumns: ["id"],
          withAlbum: false,
        });
        trackIds = data.tracks.map(({ id }) => id);
      }
    }
  } catch {}

  return trackIds;
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
