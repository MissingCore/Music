import type { UpdateOptions } from "react-native-audio-browser";
import AudioBrowser from "react-native-audio-browser";

type AdditionalConfig = {
  continuePlaybackOnDismiss?: boolean;
};

const prevSetConfigs: AdditionalConfig = {};

/**
 * Whenever we use `AudioBrowser.updateOptions()`, we need to include all
 * the options (ie: we can't just change one key, leaving the rest the same).
 */
export function getAudioBrowserOptions(
  options?: AdditionalConfig,
): UpdateOptions {
  // Merge current & previous config changes when only some keys are specified.
  if (options) {
    for (const [field, value] of Object.entries(options)) {
      // @ts-expect-error - Typing of field-value pair is correct.
      prevSetConfigs[field] = value;
    }
  }
  const { continuePlaybackOnDismiss } = prevSetConfigs;

  return {
    android: {
      appKilledPlaybackBehavior: continuePlaybackOnDismiss
        ? "continue-playback"
        : "stop-playback-and-remove-notification",
    },
    capabilities: {
      stop: false,
      jumpForward: false,
      jumpBackward: false,
      favorite: false,
      shuffleMode: false,
      repeatMode: false,
      playbackRate: false,
    },
    progressUpdateEventInterval: 1,
  };
}

const UNLOADED_STATES = ["none", "stopped"];

/** Checks to see if the AudioBrowser service is set up. */
export async function isAudioBrowserSetUp() {
  //? Since AudioBrowser can be set up headlessly, we need a new method
  //? to determine if it's interactable.
  try {
    return !UNLOADED_STATES.includes(AudioBrowser.getPlayback().state);
  } catch {
    return false;
  }
}
