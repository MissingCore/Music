import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import { playbackKeys } from "./queryKeys";
import type { PlaybackKey, TPlaybackAsyncStorage } from "../types";
import { PlaybackAsyncStorageDefaults } from "../types";

async function getPlaybackConfigs() {
  const configs: TPlaybackAsyncStorage = { ...PlaybackAsyncStorageDefaults };

  await Promise.allSettled(
    Object.keys(PlaybackAsyncStorageDefaults).map(async (_key) => {
      const key = _key as PlaybackKey;
      const value = await AsyncStorage.getItem(key);
      // @ts-expect-error Error from assignments to properties with union types.
      if (value !== null) configs[key] = JSON.parse(value);
    }),
  );
  return configs;
}

/** @description Gets all playback config information. */
export const usePlaybackConfigs = () =>
  useQuery({
    queryKey: playbackKeys.all,
    queryFn: getPlaybackConfigs,
    staleTime: Infinity,
    gcTime: Infinity,
  });
