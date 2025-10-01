import TrackPlayer from "@weights-ai/react-native-track-player";
import { useEffect } from "react";

import "~/modules/media/services/_subscriptions";
import { musicStore, useMusicStore } from "~/modules/media/services/Music";
import { useSortPreferencesStore } from "~/modules/media/services/SortPreferences";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import {
  getTrackPlayerOptions,
  setupPlayer,
} from "~/lib/react-native-track-player";
import { revalidateMusicWidget } from "~/modules/widget/utils";

/**
 * Ensure our Zustand stores are hydrated before we do anything, making
 * sure those that rely on RNTP to be initialized are hydrated after
 * RNTP is initialized.
 */
export function useSetup() {
  const musicHydrated = useMusicStore((state) => state._hasHydrated);
  const sortPreferencesHydrated = useSortPreferencesStore(
    (state) => state._hasHydrated,
  );
  const userPreferencesHydrated = useUserPreferencesStore(
    (state) => state._hasHydrated,
  );

  useEffect(() => {
    (async () => {
      await setupPlayer();
      // Ensure RNTP is successfully setup before initializing stores that
      // rely on its initialization.
      await userPreferencesStore.persist.rehydrate();
      await musicStore.persist.rehydrate();

      // Ensure widget has up-to-date data as the Music store isn't
      // immediately hydrated.
      await revalidateMusicWidget({ openApp: true, fetchLatest: true });

      const { activeId } = musicStore.getState();
      const { saveLastPosition, continuePlaybackOnDismiss } =
        userPreferencesStore.getState();
      if (saveLastPosition) musicStore.setState({ _restoredTrackId: activeId });
      else musicStore.setState({ _hasRestoredPosition: true });

      await TrackPlayer.updateOptions(
        getTrackPlayerOptions({ continuePlaybackOnDismiss, saveLastPosition }),
      );
    })();
  }, []);

  return musicHydrated && sortPreferencesHydrated && userPreferencesHydrated;
}
