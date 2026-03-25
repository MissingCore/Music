import type { UpdateOptions } from "react-native-audio-browser";

import { playbackStore } from "~/stores/Playback/store";

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
    // icon: require("~/resources/images/music-glyph.png"),
    progressUpdateEventInterval: 1,
  };
}

/** Checks to see if the AudioBrowser service is set up. */
export async function isAudioBrowserSetUp() {
  //! I think since AudioBrowser can be setup headlessly now, we need to
  //! change the method to determine if the app context is valid.
  const activeKey = playbackStore.getState().activeKey;
  return activeKey !== undefined;
}
