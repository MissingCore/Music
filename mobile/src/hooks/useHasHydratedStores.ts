import { useMusicStore } from "@/modules/media/services/Music";
import { useUserPreferencesStore } from "@/services/UserPreferences";

/** Ensures our Zustand stores are hydrated before we do anything. */
export function useHasHydratedStores() {
  const musicHydrated = useMusicStore((state) => state._hasHydrated);
  const userPreferencesHydrated = useUserPreferencesStore(
    (state) => state._hasHydrated,
  );

  return musicHydrated && userPreferencesHydrated;
}
