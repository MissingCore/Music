import { useEffect } from "react";

import "@/modules/media/services/_subscriptions";
import { musicStore, useMusicStore } from "@/modules/media/services/Music";
import { useRecentListStore } from "@/modules/media/services/RecentList";
import { useSortPreferencesStore } from "@/modules/media/services/SortPreferences";
import { setupPlayer } from "@/services/RNTPService";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "@/services/UserPreferences";

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
    const initRNTP = async () => {
      await setupPlayer();
      // Ensure RNTP is successfully setup before initializing stores that
      // rely on its initialization.
      await userPreferencesStore.persist.rehydrate();
      await musicStore.persist.rehydrate();
    };

    initRNTP();
  }, []);

  return (
    musicHydrated &&
    recentListHydrated &&
    sortPreferencesHydrated &&
    userPreferencesHydrated
  );
}
