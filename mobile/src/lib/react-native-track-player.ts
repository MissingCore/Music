import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "@weights-ai/react-native-track-player";

import { wait } from "~/utils/promise";

type AdditionalConfig = {
  continuePlaybackOnDismiss?: boolean;
  saveLastPosition?: boolean;
};

const prevSetConfigs: AdditionalConfig = {};

/**
 * Whenever we use `TrackPlayer.updateOptions()`, we need to include all
 * the options (ie: we can't just change one key, leaving the rest the same).
 */
export function getTrackPlayerOptions(options?: AdditionalConfig) {
  // Merge current & previous config changes when only some keys are specified.
  if (options) {
    for (const [field, value] of Object.entries(options)) {
      // @ts-expect-error - Typing of field-value pair is correct.
      prevSetConfigs[field] = value;
    }
  }
  const { continuePlaybackOnDismiss, saveLastPosition } = prevSetConfigs;

  return {
    android: {
      appKilledPlaybackBehavior: continuePlaybackOnDismiss
        ? AppKilledPlaybackBehavior.ContinuePlayback
        : AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
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
    icon: require("~/resources/images/music-glyph.png"),
    progressUpdateEventInterval: saveLastPosition ? 1 : undefined,
  };
}

/**
 * Ensure we setup `react-native-track-player` in the foreground in addition
 * to its configurations.
 */
export async function setupPlayer() {
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

  await TrackPlayer.updateOptions(getTrackPlayerOptions());
}
