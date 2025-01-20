import { useEffect } from "react";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from "react-native-track-player";

import "@/modules/media/services/_subscriptions";
import { musicStore, useMusicStore } from "@/modules/media/services/Music";
import { useRecentListStore } from "@/modules/media/services/RecentList";
import { useSortPreferencesStore } from "@/modules/media/services/SortPreferences";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "@/services/UserPreferences";

import { wait } from "@/utils/promise";

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

/**
 * Ensure we setup `react-native-track-player` in the foreground in addition
 * to its configurations.
 */
async function setupPlayer() {
  const setup = async () => {
    try {
      await TrackPlayer.setupPlayer();
    } catch (_err) {
      const err = _err as Error & { code?: string };
      console.log(`[RNTP Error] ${err.code}`);
      return err.code;
    }
  };

  // `setupPlayer` must be called when app is in the foreground, otherwise,
  // an `'android_cannot_setup_player_in_background'` error will be thrown.
  while ((await setup()) === "android_cannot_setup_player_in_background") {
    // Timeouts will only execute when the app is in the foreground. If
    // it somehow executes in the background, the promise will be rejected
    // and we'll try this again.
    await wait(1);
  }

  // Repeat mode is needed for the "next" button to show up in the widget
  // if we're on the last track.
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    icon: require("@/resources/images/music-glyph.png"),
  });
}
