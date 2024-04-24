import { atom } from "jotai";
import { RESET, unwrap } from "jotai/utils";

import { db } from "@/db";
import { soundRefAtom } from "./globalSound";
import type { TTrackSrc } from "../utils/trackList";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description Current track position in milliseconds. */
export const trackPositionMsAtom = atom(0);

/**
 * @description Structure of the data store in AsyncStorage about the
 *  current playing media.
 */
export type TPlayingInfo = {
  /** Id of the current playing track. */
  trackId: string | undefined;
  /** Information about the list of tracks `trackId` can come from. */
  listSrc: TTrackSrc | undefined;
  /** List of track ids we can play from. */
  trackList: string[];
  /** Index of `trackId` in `trackList`. */
  trackIdx: number;
  /** List of track ids we want to play after the current track. */
  queueList: string[];
};

/**
 * @description Default structure of the data we'll store in AsyncStorage
 *  related to the current playing media.
 */
export const DefaultPlayingInformation: TPlayingInfo = {
  trackId: undefined,
  listSrc: undefined,
  trackList: [],
  trackIdx: 0,
  queueList: [],
};

/** @description [FOR INTERNAL USE ONLY] */
export const playingInfoAsyncAtom = createAtomWithStorage<TPlayingInfo>(
  "playing-info",
  DefaultPlayingInformation,
);
/** @description Info about the current playing & upcoming tracks. */
export const playingInfoAtom = unwrap(
  playingInfoAsyncAtom,
  (prev) => prev ?? DefaultPlayingInformation,
);

/** @description Resets `playingInfoAtom` to its default values. */
export const resetPlayingInfoAtom = atom(null, async (_get, set) => {
  set(playingInfoAsyncAtom, RESET);
});

/** @description Add a track to the end of the queue. */
export const addTrackToQueueAtom = atom(
  null,
  async (get, set, trackId: string) => {
    const currPlayingInfo = await get(playingInfoAsyncAtom);
    set(playingInfoAsyncAtom, {
      ...currPlayingInfo,
      queueList: [...currPlayingInfo.queueList, trackId],
    });
  },
);

/** @description Remove the track at a specific index in the queue. */
export const removeTrackAtQueueIdxAtom = atom(
  null,
  async (get, set, idx: number) => {
    const currPlayingInfo = await get(playingInfoAsyncAtom);
    const newQueueList = [...currPlayingInfo.queueList];
    newQueueList.splice(idx, 1);
    set(playingInfoAsyncAtom, { ...currPlayingInfo, queueList: newQueueList });
  },
);

/** @description [FOR INTERNAL USE ONLY] Gets info about the current track. */
export const currentTrackDataAsyncAtom = atom(async (get) => {
  try {
    const { trackId } = await get(playingInfoAsyncAtom);
    if (!trackId) throw new Error("No track id found.");
    const currTrack = await db.query.tracks.findFirst({
      where: (fields, { eq }) => eq(fields.id, trackId),
      columns: { albumId: false, track: false, modificationTime: false },
      with: { album: { columns: { id: true, name: true, coverSrc: true } } },
    });
    if (!currTrack) throw new Error(`Track (${trackId}) doesn't exist.`);
    const { album, coverSrc, ...rest } = currTrack;
    return {
      ...rest,
      album: album ? { id: album.id, name: album.name } : null,
      coverSrc: album?.coverSrc ?? coverSrc,
    };
  } catch (err) {
    return undefined;
  }
});
/** @description Info about the current track. */
export const currentTrackDataAtom = unwrap(
  currentTrackDataAsyncAtom,
  (prev) => prev ?? undefined,
);

/** @description Loads track in when we open the app. */
export const loadTrackAtom = atom(null, async (get) => {
  const soundRef = get(soundRefAtom);
  const trackStatus = await soundRef.getStatusAsync();
  if (!trackStatus.isLoaded) {
    const trackData = await get(currentTrackDataAsyncAtom);
    if (trackData) await soundRef.loadAsync({ uri: trackData.uri });
  }
});
