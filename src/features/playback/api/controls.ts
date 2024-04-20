import { atom } from "jotai";

import { repeatAsyncAtom, shuffleAsyncAtom } from "./configs";
import { soundRefAtom } from "./globalSound";
import type { TPlayingInfo } from "./playing";
import {
  currentTrackDataAsyncAtom,
  playingInfoAsyncAtom,
  trackPositionMsAtom,
} from "./playing";

import { isTrackSrcsEqual } from "../utils/comparison";
import type { TTrackSrc } from "../utils/trackList";
import { getTrackList, shuffle } from "../utils/trackList";

/** @description Whether a track is currently playing. */
export const isPlayingAtom = atom(false);

type TPlayFn = { trackId?: string; trackSrc: TTrackSrc };

/** @description Asynchronous write-only atom for playing tracks. */
export const playAtom = atom(
  null,
  async (get, set, { trackId, trackSrc }: TPlayFn) => {
    const currPlayingInfo = await get(playingInfoAsyncAtom);
    const shouldShuffle = await get(shuffleAsyncAtom);

    // 1. See if we're playing from a new track list.
    const isNewTrackList = !isTrackSrcsEqual(currPlayingInfo.listSrc, trackSrc);
    const isTrackDefined = !!trackId;
    const isDifferentTrack =
      currPlayingInfo.trackId === undefined ||
      trackId !== currPlayingInfo.trackId;

    // 2. Handle when the track list is the same.
    if (!isNewTrackList) {
      // 2a. Handle when we play a different song in the track list.
      if (isTrackDefined && isDifferentTrack) {
        set(playingInfoAsyncAtom, {
          ...currPlayingInfo,
          trackId,
          trackIdx: currPlayingInfo.trackList.findIndex(
            (tId) => tId === trackId,
          )!,
        });
        set(playTrackAtom, { action: "new" });
        return;
      }
      // 2b. Handle when we're playing the same song in the track list.
      set(playTrackAtom);
      return;
    }

    // 3. Handle when the track list is new.
    let newTrackList = await getTrackList(trackSrc);
    if (shouldShuffle) newTrackList = shuffle(newTrackList);

    // 3a. Get the index of the track we'll play.
    let newTrackIdx = 0;
    if (isTrackDefined) {
      if (shouldShuffle) {
        // Move `trackId` to the front of `newTrackList`.
        newTrackList = [
          trackId,
          ...newTrackList.filter((id) => id !== trackId),
        ];
      } else {
        // Find the index of the track.
        newTrackIdx = newTrackList.findIndex((id) => id === trackId);
      }
    }

    // 3b. Play the track.
    set(playingInfoAsyncAtom, {
      ...currPlayingInfo,
      listSrc: trackSrc,
      trackList: newTrackList,
      trackIdx: newTrackIdx,
      trackId: newTrackList[newTrackIdx],
    });

    if (isDifferentTrack) set(playTrackAtom, { action: "new" });
    else set(playTrackAtom);
  },
);

type TPlayTrackOpts = { action: "new" | "queue" | "paused" };

/** @description Internal function for playing the current song. */
const playTrackAtom = atom(null, async (get, set, opts?: TPlayTrackOpts) => {
  try {
    const soundRef = get(soundRefAtom);
    const shouldPlay = opts?.action !== "paused";

    // Make sure next track is played on completion.
    soundRef.setOnPlaybackStatusUpdate((playbackStatus) => {
      if (!playbackStatus.isLoaded) return;
      const { didJustFinish, positionMillis } = playbackStatus;
      set(trackPositionMsAtom, positionMillis);
      if (didJustFinish) set(nextAtom);
    });

    switch (opts?.action) {
      case "new":
      case "paused": {
        const trackData = await get(currentTrackDataAsyncAtom);
        if (!trackData) throw new Error("No track data found.");
        await soundRef.unloadAsync(); // Needed if we want to replace the current track.
        await soundRef.loadAsync({ uri: trackData.uri }, { shouldPlay });
        break;
      }
      default:
        // If we don't define any options, we assume we're just unpausing a track.
        await soundRef.playAsync();
    }

    set(isPlayingAtom, shouldPlay);
  } catch (err) {
    // Catch cases where media failed to load or if it's already loaded.
    console.log(err);
  }
});

/** @description Asynchronous write-only atom for pausing tracks. */
export const pauseAtom = atom(null, async (get, set) => {
  await get(soundRefAtom).pauseAsync();
  set(isPlayingAtom, false);
});

/**
 * @description Asynchronous write-only atom for updating the current
 *  track position to the value in `trackPositionMsAtom`.
 */
export const updateTrackPosAtom = atom(null, async (get) => {
  const soundRef = get(soundRefAtom);
  await soundRef.setStatusAsync({ positionMillis: get(trackPositionMsAtom) });
});

/**
 * @description Asynchronous write-only atom that toggle `isPlaying` and
 *  will play or pause the current playing track.
 */
export const playPauseToggleAtom = atom(null, async (get, set) => {
  if (get(isPlayingAtom)) set(pauseAtom);
  else set(playTrackAtom);
});

/** @description Asynchronous write-only atom for playing the next track. */
export const nextAtom = atom(null, async (get, set) => {
  const currPlayingInfo = await get(playingInfoAsyncAtom);
  const shouldRepeat = await get(repeatAsyncAtom);

  let newConfigs: Partial<TPlayingInfo> = {};

  if (currPlayingInfo.queueList.length > 0) {
    const [newTrackId, ...newQueueList] = currPlayingInfo.queueList;
    newConfigs = { trackId: newTrackId, queueList: newQueueList };
  } else {
    const { trackIdx, trackList } = currPlayingInfo;
    const newTrackIdx = trackIdx < trackList.length - 1 ? trackIdx + 1 : 0;
    newConfigs = { trackId: trackList[newTrackIdx], trackIdx: newTrackIdx };
  }

  set(playingInfoAsyncAtom, { ...currPlayingInfo, ...newConfigs });
  set(playTrackAtom, {
    action: !shouldRepeat && newConfigs.trackIdx === 0 ? "paused" : "new",
  });
});

/** @description Asynchronous write-only atom for playing the previous track. */
export const prevAtom = atom(null, async (get, set) => {
  const currPlayingInfo = await get(playingInfoAsyncAtom);
  const soundRef = get(soundRefAtom);

  // Start from the beginning of the current track instead of playing the
  // previous track if we've played more than 10 seconds.
  const trackStatus = await soundRef.getStatusAsync();
  const startFromBeginning =
    trackStatus.isLoaded && trackStatus.positionMillis > 10000;

  if (!startFromBeginning) {
    const { trackIdx, trackList } = currPlayingInfo;
    const newTrackIdx = trackIdx > 0 ? trackIdx - 1 : trackList.length - 1;
    set(playingInfoAsyncAtom, {
      ...currPlayingInfo,
      trackId: trackList[newTrackIdx],
      trackIdx: newTrackIdx,
    });
  }

  set(playTrackAtom, { action: "new" });
});
