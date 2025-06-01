import { useEffect } from "react";
import TrackPlayer from "react-native-track-player";

import "~/modules/media/services/_subscriptions";
import { musicStore, useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useRecentListStore } from "~/modules/media/services/RecentList";
import { useSortPreferencesStore } from "~/modules/media/services/SortPreferences";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import {
  getTrackPlayerOptions,
  setupPlayer,
} from "~/lib/react-native-track-player";

/**
 * Ensure our Zustand stores are hydrated before we do anything, making
 * sure those that rely on RNTP to be initialized are hydrated after
 * RNTP is initialized.
 */
export function useSetup() {
  const musicHydrated = useMusicStore((state) => state._hasHydrated);
  const recentListHydrated = useRecentListStore((state) => state._hasHydrated);
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

      if (userPreferencesStore.getState().saveLastPosition) {
        await TrackPlayer.updateOptions(
          getTrackPlayerOptions({ progressUpdateEventInterval: 1 }),
        );
        const lastPosition = musicStore.getState().lastPosition;
        if (lastPosition !== null) await MusicControls.seekTo(lastPosition);
      }
    })();
  }, []);

  return (
    musicHydrated &&
    recentListHydrated &&
    sortPreferencesHydrated &&
    userPreferencesHydrated
  );
}
