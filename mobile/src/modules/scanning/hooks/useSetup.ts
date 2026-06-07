import { GlyphToy } from "@missingcore/music-glyph-toys";
import { useEffect, useState } from "react";
import AudioBrowser from "react-native-audio-browser";

import { addPlayedMediaList } from "~/data/recent/api";
import { onAppStartUpInit } from "~/initServices";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import {
  equalizerStore,
  useEqualizerStore,
} from "~/modules/audio/equalizer/core/store";
import {
  _initEQStore,
  setEQPreset,
} from "~/modules/audio/equalizer/core/actions";
import { getCustomFonts } from "~/modules/customization/font/core/data";
import { loadCustomFont } from "~/modules/customization/font/utils";
import { useLyricStore } from "~/modules/lyric/core/store";

import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";

type SetupState = "idle" | "pending" | "ready";

/**
 * Ensure our Zustand stores are hydrated before we do anything, making
 * sure those that rely on AudioBrowser to be initialized are hydrated
 * after AudioBrowser is initialized.
 */
export function useSetup() {
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const playbackHydrated = usePlaybackStore((s) => s._hasHydrated);
  const preferenceHydrated = usePreferenceStore((s) => s._hasHydrated);
  const equalizerHydrated = useEqualizerStore((s) => s._hasHydrated);
  const lyricHydrated = useLyricStore((s) => s._hasHydrated);

  useEffect(() => {
    if (
      !playbackHydrated ||
      !preferenceHydrated ||
      !equalizerHydrated ||
      !lyricHydrated ||
      setupState !== "idle"
    ) {
      return;
    }

    (async () => {
      setSetupState("pending");
      GlyphToy.connect();
      await onAppStartUpInit;

      // Load custom fonts. Done in a try-catch due to Sentry reporting error
      // that `custom_fonts` table doesn't exist.
      try {
        const savedCustomFonts = await getCustomFonts();
        await Promise.allSettled(
          savedCustomFonts.map((f) => loadCustomFont(f.uri)),
        );
      } catch (err) {
        if (SENTRY_ENABLED && !__DEV__) Sentry.captureException(err);
      }

      // Initial Equalizer store values after we ensure AudioBrowser is initialized.
      // Otherwise we get startup crashes from calling `AudioBrowser.getEqualizerSettings()`.
      _initEQStore();

      // Prevent Android Auto from reading stale cached data on app launch
      // if it's reusing a prior session.
      //  - This should be enough as you shouldn't be changing anything
      //  in the current Android Auto session as should be driving.
      AudioBrowser.revalidateBrowser();

      // Ensure widget has up-to-date data as the Playback store isn't
      // immediately hydrated.
      await revalidateWidgets({ openApp: !playbackStore.getState().isPlaying });

      const {
        repeat,
        playingFrom,
        activeKey,
        isReplayGainEnabled,
        restoreVolume,
        volume,
      } = playbackStore.getState();
      const { restoreLastPosition, continuePlaybackOnDismiss } =
        preferenceStore.getState();
      if (restoreLastPosition) {
        playbackStore.setState({ _restoredTrackKey: activeKey });
      } else {
        playbackStore.setState({ _hasRestoredPosition: true, lastPosition: 0 });
      }

      // Ensure correct AudioBrowser settings.
      AudioBrowser.updateOptions(
        getAudioBrowserOptions({ continuePlaybackOnDismiss }),
      );
      if (repeat === RepeatModes.REPEAT_ONE) {
        AudioBrowser.setRepeatMode("track");
      }
      if (restoreVolume) AudioBrowser.setVolume(volume);
      else playbackStore.setState({ volume: 1 });
      AudioBrowser.setReplayGainStatus(isReplayGainEnabled);

      // Ensure equalizer settings are loaded.
      const { enabled, preset } = equalizerStore.getState();
      if (enabled) {
        AudioBrowser.setEqualizerEnabled(true);
        setEQPreset(preset);
      }

      // Ensure the current list is at the top of recently played lists.
      if (playingFrom) await addPlayedMediaList(playingFrom);

      setSetupState("ready");
    })();
  }, [
    playbackHydrated,
    preferenceHydrated,
    equalizerHydrated,
    lyricHydrated,
    setupState,
  ]);

  return setupState === "ready";
}
