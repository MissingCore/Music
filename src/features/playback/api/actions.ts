import BackgroundTimer from "@boterop/react-native-background-timer";
import { atom } from "jotai";
import { Toast } from "react-native-toast-notifications";
import TrackPlayer from "react-native-track-player";

import { formatTrackforPlayer } from "@/db/utils/formatters";

import { repeatAsyncAtom, shuffleAsyncAtom } from "./configs";
import { soundRefAtom } from "./globalSound";
import { queueListAsyncAtom } from "./queue";
import {
  playingMediaAsyncAtom,
  positionMsAtom,
  resetPlayingInfoAtom,
  trackDataAsyncAtom,
  trackListAsyncAtom,
} from "./track";
import { recentlyPlayedAsyncAtom } from "./recent";
import type { TrackListSource } from "../types";
import { areTrackReferencesEqual, refreshTrackListData } from "../utils";

/**
 * @description Id of track we want to play — will be used to help debounce
 *  the track that'll be played after we stop clicking the next/prev button.
 */
const queuedTrackAtom = atom("");

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
    let isDifferentTrack =
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
      startingTrack: id ?? playingMedia.id,
    });
    if (trackList.length === 0) return;

    // 3a. Play the track.
    const newTrackId = trackList[listIndex];
    set(playingMediaAsyncAtom, { id: newTrackId, listIndex });
    set(trackListAsyncAtom, { data: trackList, reference: source });

    isDifferentTrack = playingMedia.id !== newTrackId;
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
  const soundRef = get(soundRefAtom);
  const shouldPlay = opts?.action !== "paused";

  // Make sure the track player notification is displayed. If not displayed,
  // add some delay due to the notification stopping tracks from `expo-av`
  // from playing temporarily.
  const isPlayerLoaded = await TrackPlayer.getActiveTrack();

  // Make sure next track is played on completion.
  soundRef.setOnPlaybackStatusUpdate((playbackStatus) => {
    if (!playbackStatus.isLoaded) return;
    const { didJustFinish, positionMillis } = playbackStatus;
    set(positionMsAtom, positionMillis);
    if (didJustFinish) set(nextAtom);
    else if (
      !playbackStatus.isPlaying &&
      !playbackStatus.isBuffering &&
      playbackStatus.playableDurationMillis !== positionMillis &&
      get(isPlayingAtom)
    ) {
      // Pause track if it was paused by media playing in a different app.
      set(pauseAtom);
    }
  });

  if (opts?.action) {
    const trackData = await get(trackDataAsyncAtom);
    if (!trackData) {
      set(resetPlayingInfoAtom);
      await soundRef.unloadAsync();
      console.log("[Error: No track data found.]");
      return;
    }

    set(queuedTrackAtom, trackData.id);
    await soundRef.unloadAsync(); // Needed if we want to replace the current track.
    await TrackPlayer.load(formatTrackforPlayer(trackData));
    set(positionMsAtom, 0);

    BackgroundTimer.setTimeout(
      async () => {
        // Check if the user was spamming the next/prev button.
        if (trackData.id !== get(queuedTrackAtom)) return;
        try {
          await soundRef.loadAsync({ uri: trackData.uri }, { shouldPlay });
          await TrackPlayer.seekTo(0);
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("java.io.FileNotFoundException")
          ) {
            // Played track no longer exists; reset context.
            set(resetPlayingInfoAtom);
            Toast.show("Track no longer exists.", { type: "danger" });
          }
          // Catch cases where media failed to load or if it's already loaded.
          console.log(err);
        }
      },
      isPlayerLoaded ? 150 : 250,
    );
  } else {
    // If we don't define any options, we assume we're just unpausing a track.
    if (!isPlayerLoaded) {
      const trackData = await get(trackDataAsyncAtom); // Should always be defined.
      if (trackData) await TrackPlayer.load(formatTrackforPlayer(trackData));
      BackgroundTimer.setTimeout(async () => await soundRef.playAsync(), 250);
    } else {
      await soundRef.playAsync();
    }
  }

  if (shouldPlay) await TrackPlayer.play();
  else await TrackPlayer.pause();
  set(isPlayingAtom, shouldPlay);
});

/** @description Method for pausing the current playing track. */
export const pauseAtom = atom(null, async (get, set) => {
  await get(soundRefAtom).pauseAsync();
  await TrackPlayer.pause();
  set(isPlayingAtom, false);
});

/** @description Updates the current track position to the value in `trackPositionMsAtom`. */
export const updateTrackPosAtom = atom(
  null,
  async (get, _set, newPositionSec?: number) => {
    const soundRef = get(soundRefAtom);
    const newPositionMs =
      newPositionSec !== undefined
        ? newPositionSec * 1000
        : get(positionMsAtom);
    await soundRef.setStatusAsync({ positionMillis: newPositionMs });
    await TrackPlayer.seekTo(newPositionMs / 1000);
  },
);

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

  set(positionMsAtom, 0);
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
