import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { playbackKeys } from "./queryKeys";
import type { TPlaybackAsyncStorage } from "../types";

async function updateTrack(trackId: string) {
  await AsyncStorage.setItem("currentTrack", trackId);
  return trackId;
}

/** @description Toggle a toggleable playback control. */
export const useUpdateCurrentTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => updateTrack(trackId),
    onSuccess: (newTrackId: string) => {
      queryClient.setQueryData(playbackKeys.config("currentTrack"), newTrackId);
      queryClient.setQueryData(
        playbackKeys.all,
        (old: TPlaybackAsyncStorage) => ({ ...old, currentTrack: newTrackId }),
      );
    },
  });
};
