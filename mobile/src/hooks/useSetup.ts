import TrackPlayer, { RepeatMode } from "@weights-ai/react-native-track-player";
import { useEffect } from "react";

import "~/services/_subscriptions";
import "~/modules/media/services/_subscriptions";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { RepeatModes } from "~/stores/Playback/constants";
import { useSortPreferencesStore } from "~/modules/media/services/SortPreferences";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import {
  getTrackPlayerOptions,
  setupPlayer,
} from "~/lib/react-native-track-player";
import { revalidateWidgets } from "~/modules/widget/utils";

/**
 * Ensure our Zustand stores are hydrated before we do anything, making
 * sure those that rely on RNTP to be initialized are hydrated after
 * RNTP is initialized.
 */
export function useSetup() {
  const playbackHydrated = usePlaybackStore((s) => s._hasHydrated);
  const sortPreferencesHydrated = useSortPreferencesStore(
    (s) => s._hasHydrated,
  );
  const userPreferencesHydrated = useUserPreferencesStore(
    (s) => s._hasHydrated,
  );

  useEffect(() => {
    (async () => {
      await setupPlayer();
      // Ensure RNTP is successfully setup before initializing stores that
      // rely on its initialization.
      await userPreferencesStore.persist.rehydrate();
      await playbackStore.persist.rehydrate();

      // Ensure widget has up-to-date data as the Playback store isn't
      // immediately hydrated.
      await revalidateWidgets({ openApp: true });

      const { repeat, activeId } = playbackStore.getState();
      const { saveLastPosition, continuePlaybackOnDismiss } =
        userPreferencesStore.getState();
      if (saveLastPosition)
        playbackStore.setState({ _restoredTrackId: activeId });
      else playbackStore.setState({ _hasRestoredPosition: true });

      // Ensure correct RNTP settings.
      await TrackPlayer.updateOptions(
        getTrackPlayerOptions({ continuePlaybackOnDismiss }),
      );
      if (repeat === RepeatModes.REPEAT_ONE) {
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
      }
    })();
  }, []);

  return playbackHydrated && sortPreferencesHydrated && userPreferencesHydrated;
}
