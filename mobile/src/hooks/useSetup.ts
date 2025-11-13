import TrackPlayer, { RepeatMode } from "@weights-ai/react-native-track-player";
import { useEffect, useState } from "react";

import { addPlayedMediaList } from "~/api/recent";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { useSortPreferencesStore } from "~/modules/media/services/SortPreferences";

import {
  getTrackPlayerOptions,
  onAppStartUpInit,
} from "~/lib/react-native-track-player";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";

type SetupState = "idle" | "pending" | "ready";

/**
 * Ensure our Zustand stores are hydrated before we do anything, making
 * sure those that rely on RNTP to be initialized are hydrated after
 * RNTP is initialized.
 */
export function useSetup() {
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const playbackHydrated = usePlaybackStore((s) => s._hasHydrated);
  const sortPreferencesHydrated = useSortPreferencesStore(
    (s) => s._hasHydrated,
  );
  const preferenceHydrated = usePreferenceStore((s) => s._hasHydrated);

  useEffect(() => {
    if (
      !playbackHydrated ||
      !sortPreferencesHydrated ||
      !preferenceHydrated ||
      setupState !== "idle"
    ) {
      return;
    }

    (async () => {
      setSetupState("pending");
      await onAppStartUpInit;

      // Ensure widget has up-to-date data as the Playback store isn't
      // immediately hydrated.
      await revalidateWidgets({ openApp: true });

      const { repeat, playingFrom, activeKey } = playbackStore.getState();
      const { restoreLastPosition, continuePlaybackOnDismiss } =
        preferenceStore.getState();
      if (restoreLastPosition) {
        playbackStore.setState({ _restoredTrackKey: activeKey });
      } else playbackStore.setState({ _hasRestoredPosition: true });

      // Ensure correct RNTP settings.
      await TrackPlayer.updateOptions(
        getTrackPlayerOptions({ continuePlaybackOnDismiss }),
      );
      if (repeat === RepeatModes.REPEAT_ONE) {
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
      }

      // Ensure the current list is at the top of recently played lists.
      if (playingFrom) await addPlayedMediaList(playingFrom);

      setSetupState("ready");
    })();
  }, [
    playbackHydrated,
    sortPreferencesHydrated,
    preferenceHydrated,
    setupState,
  ]);

  return setupState === "ready";
}
