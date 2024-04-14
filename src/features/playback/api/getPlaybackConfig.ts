import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { playbackKeys } from "./queryKeys";
import type { PlaybackKey, PlaybackValue } from "../types";
import { PlaybackAsyncStorageDefaults } from "../types";

type QueryKeyType = ReturnType<typeof playbackKeys.config>;
type QueryFnOpts = QueryFunctionContext<QueryKeyType>;

async function getPlaybackConfig({ queryKey: [{ key }] }: QueryFnOpts) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return PlaybackAsyncStorageDefaults[key];
    return JSON.parse(value) as PlaybackValue<typeof key>;
  } catch (err) {
    console.log(err);
    // Return the default value even when we fail.
    return PlaybackAsyncStorageDefaults[key];
  }
}

/** @description Gets specified playback config information. */
export const usePlaybackConfig = (key: PlaybackKey) =>
  useQuery({
    queryKey: playbackKeys.config(key),
    queryFn: getPlaybackConfig,
    staleTime: Infinity,
    gcTime: Infinity,
  });
