import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import { playbackKeys } from "./queryKeys";
import type { PlaybackKey, PlaybackValue } from "../types";
import { PlaybackAsyncStorageDefaults } from "../types";

async function getPlaybackConfig<TKey extends PlaybackKey>(key: TKey) {
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
export const usePlaybackConfig = <TKey extends PlaybackKey>(key: TKey) =>
  useQuery({
    queryKey: playbackKeys.config(key),
    queryFn: () => getPlaybackConfig(key),
    staleTime: Infinity,
    gcTime: Infinity,
  });
