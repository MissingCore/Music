import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { playbackKeys } from "./queryKeys";
import type { ToggleableControls } from "../types";

async function toggleControl(key: ToggleableControls, currState: boolean) {
  await AsyncStorage.setItem(key, JSON.stringify(!currState));
}

/** @description Toggle a toggleable playback control. */
export const useToggleControl = (key: ToggleableControls) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currState: boolean) => toggleControl(key, currState),
    onSuccess: () => {
      queryClient.setQueryData(
        playbackKeys.config(key),
        (oldState: boolean) => !oldState,
      );
    },
  });
};
