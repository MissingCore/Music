import { atom } from "jotai";

import { repeatAsyncAtom, shuffleAsyncAtom } from "./configs";
import { soundRefAtom } from "./globalSound";
import { queueListAsyncAtom } from "./queue";
import {
  playingMediaAsyncAtom,
  positionMsAtom,
  trackDataAsyncAtom,
  trackListAsyncAtom,
} from "./track";
import { recentlyPlayedAsyncAtom } from "./recent";
import type { TrackListSource } from "../types";
import { areTrackReferencesEqual, refreshTrackListData } from "../utils";

/** @description Whether a track is currently playing. */
export const isPlayingAtom = atom(false);

type TPlayFn = { id?: string; source: TrackListSource };

/** @description Play a track from a given source. */
export const playAtom = atom(
  null,
  async (get, set, { id, source }: TPlayFn) => {
    const currentTrackList = await get(trackListAsyncAtom);
    const playingMedia = await get(playingMediaAsyncAtom);
    const shouldShuffle = await get(shuffleAsyncAtom);

    // 1. See if we're playing from a new track list.
    const isNewTrackList = !areTrackReferencesEqual(
      currentTrackList.reference,
      source,
    );
    const isTrackDefined = !!id;
    const isDifferentTrack =
      playingMedia.id === undefined || id !== playingMedia.id;

    // 2. Handle when the track list is the same.
    if (!isNewTrackList) {
      // 2a. Handle when we play a different song in the track list.
      if (isTrackDefined && isDifferentTrack) {
        const newListIdx = currentTrackList.data.findIndex((tId) => tId === id);
        set(playingMediaAsyncAtom, { id, listIndex: newListIdx });
        set(playTrackAtom, { action: "new" });
      } else {
        // 2b. Handle when we're playing the same song in the track list.
        set(playTrackAtom);
      }
      return;
    }

    // 3. Handle when the track list is new.
    const { listIndex, trackList } = await refreshTrackListData({
      listSource: source,
      shuffle: shouldShuffle,
      startingTrack: id,
    });

    // 3a. Play the track.
    set(playingMediaAsyncAtom, { id: trackList[listIndex], listIndex });
    set(trackListAsyncAtom, { data: trackList, reference: source });

    if (isDifferentTrack) set(playTrackAtom, { action: "new" });
    else set(playTrackAtom);

    // 3b. Add track source to "recently played".
    const currRecentlyPlayed = await get(recentlyPlayedAsyncAtom);
    set(recentlyPlayedAsyncAtom, [
      source,
      ...currRecentlyPlayed
        .filter((data) => !areTrackReferencesEqual(data, source))
        .slice(0, 9),
    ]);
  },
);

type TPlayTrackOpts = { action: "new" | "paused" };

/** @description Internal function for playing the current song. */
const playTrackAtom = atom(null, async (get, set, opts?: TPlayTrackOpts) => {
  try {
    const soundRef = get(soundRefAtom);
    const shouldPlay = opts?.action !== "paused";

    // Make sure next track is played on completion.
    soundRef.setOnPlaybackStatusUpdate((playbackStatus) => {
      if (!playbackStatus.isLoaded) return;
      const { didJustFinish, positionMillis } = playbackStatus;
      set(positionMsAtom, positionMillis);
      if (didJustFinish) set(nextAtom);
    });

    if (opts?.action === "new" || opts?.action === "paused") {
      const trackData = await get(trackDataAsyncAtom);
      if (!trackData) throw new Error("No track data found.");
      await soundRef.unloadAsync(); // Needed if we want to replace the current track.
      await soundRef.loadAsync({ uri: trackData.uri }, { shouldPlay });
    } else {
      // If we don't define any options, we assume we're just unpausing a track.
      await soundRef.playAsync();
    }

    set(isPlayingAtom, shouldPlay);
  } catch (err) {
    // Catch cases where media failed to load or if it's already loaded.
    console.log(err);
  }
});

/** @description Method for pausing the current playing track. */
export const pauseAtom = atom(null, async (get, set) => {
  await get(soundRefAtom).pauseAsync();
  set(isPlayingAtom, false);
});

/** @description Updates the current track position to the value in `trackPositionMsAtom`. */
export const updateTrackPosAtom = atom(null, async (get) => {
  const soundRef = get(soundRefAtom);
  await soundRef.setStatusAsync({ positionMillis: get(positionMsAtom) });
});

/** @description Toggle `isPlaying`, playing or pausing the current track. */
export const playPauseToggleAtom = atom(null, async (get, set) => {
  if (get(isPlayingAtom)) set(pauseAtom);
  else set(playTrackAtom);
});

/** @description Method for playing the next track. */
export const nextAtom = atom(null, async (get, set) => {
  const queueList = await get(queueListAsyncAtom);
  const { id, listIndex } = await get(playingMediaAsyncAtom);
  const { data: trackList } = await get(trackListAsyncAtom);
  const shouldRepeat = await get(repeatAsyncAtom);

  let newPlayingMedia = { id, listIndex };

  if (queueList.length > 0) {
    const [newTrackId, ...newQueueList] = queueList;
    newPlayingMedia.id = newTrackId;
    set(queueListAsyncAtom, newQueueList);
  } else {
    const newListIdx = listIndex < trackList.length - 1 ? listIndex + 1 : 0;
    newPlayingMedia = { id: trackList[newListIdx], listIndex: newListIdx };
  }

  set(playingMediaAsyncAtom, newPlayingMedia);
  set(playTrackAtom, {
    action: !shouldRepeat && newPlayingMedia.listIndex === 0 ? "paused" : "new",
  });
});

/** @description Method for playing the previous track. */
export const prevAtom = atom(null, async (get, set) => {
  const { listIndex } = await get(playingMediaAsyncAtom);
  const { data: trackList } = await get(trackListAsyncAtom);
  const soundRef = get(soundRefAtom);

  // Start from the beginning of the current track instead of playing the
  // previous track if we've played more than 10 seconds.
  const trackStatus = await soundRef.getStatusAsync();
  const startFromBeginning =
    trackStatus.isLoaded && trackStatus.positionMillis > 10000;

  if (!startFromBeginning) {
    const newListIdx = listIndex > 0 ? listIndex - 1 : trackList.length - 1;
    set(playingMediaAsyncAtom, {
      id: trackList[newListIdx],
      listIndex: newListIdx,
    });
  }

  set(playTrackAtom, { action: "new" });
});
