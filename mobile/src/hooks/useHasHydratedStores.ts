import "@/modules/media/services/_subscriptions";
import { useMusicStore } from "@/modules/media/services/Music";
import { useRecentListStore } from "@/modules/media/services/RecentList";
import { useSortPreferencesStore } from "@/modules/media/services/SortPreferences";
import { useUserPreferencesStore } from "@/services/UserPreferences";

/** Ensures our Zustand stores are hydrated before we do anything. */
export function useHasHydratedStores() {
  const musicHydrated = useMusicStore((state) => state._hasHydrated);
  const recentListHydrated = useRecentListStore((state) => state._hasHydrated);
  const sortPreferencesHydrated = useSortPreferencesStore(
    (state) => state._hasHydrated,
  );
  const userPreferencesHydrated = useUserPreferencesStore(
    (state) => state._hasHydrated,
  );

  return (
    musicHydrated &&
    recentListHydrated &&
    sortPreferencesHydrated &&
    userPreferencesHydrated
  );
}
