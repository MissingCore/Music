import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { RESET, unwrap } from "jotai/utils";
import TrackPlayer from "react-native-track-player";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";
import { formatTrackforPlayer } from "@/db/utils/formatters";

import { soundRefAtom } from "./globalSound";
import { queueListAsyncAtom } from "./queue";
import type { TrackListSource } from "../types";

import { createAtomWithStorage } from "@/lib/jotai";

const _playingMediaDefault = { id: undefined, listIndex: 0 };
/** @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const playingMediaAsyncAtom = createAtomWithStorage<{
  id: string | undefined;
  listIndex: number;
}>("playing-media", _playingMediaDefault);
/** @description Reference of the current playing track. */
export const playingMediaAtom = unwrap(
  playingMediaAsyncAtom,
  (prev) => prev ?? _playingMediaDefault,
);

/** @description Current track position in milliseconds. */
export const positionMsAtom = atom(0);

const _trackListDefault = { data: [], reference: undefined };
/** @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const trackListAsyncAtom = createAtomWithStorage<{
  data: string[];
  reference: TrackListSource | undefined;
}>("track-list", _trackListDefault);
/** @description List of track ids we'll play from. */
export const trackListAtom = unwrap(
  trackListAsyncAtom,
  (prev) => prev ?? _trackListDefault,
);

/** @description Reset atoms describing the playing media. */
export const resetPlayingInfoAtom = atom(null, async (_get, set) => {
  set(playingMediaAsyncAtom, RESET);
  set(positionMsAtom, 0);
  set(queueListAsyncAtom, RESET);
  set(trackListAsyncAtom, RESET);
  await TrackPlayer.reset();
});

/** @description [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const trackDataAsyncAtom = atom(async (get) => {
  try {
    const { id } = await get(playingMediaAsyncAtom);
    if (!id) throw new Error("No track id found.");
    return await getTrack([eq(tracks.id, id)]);
  } catch (err) {
    return undefined;
  }
});
/** @description Information about the playing track. */
export const trackDataAtom = unwrap(
  trackDataAsyncAtom,
  (prev) => prev ?? undefined,
);

/** @description Loads track in when we open the app. */
export const loadTrackAtom = atom(null, async (get) => {
  const soundRef = get(soundRefAtom);
  const trackStatus = await soundRef.getStatusAsync();

  if (!trackStatus.isLoaded) {
    const trackData = await get(trackDataAsyncAtom);
    if (trackData) {
      await soundRef.loadAsync({ uri: trackData.uri });
      await TrackPlayer.load(formatTrackforPlayer(trackData));
    }
  }
});
