import { GlyphToy } from "@missingcore/music-glyph-toys";
import { useEffect, useState } from "react";
import AudioBrowser from "react-native-audio-browser";

import { addPlayedMediaList } from "~/data/recent/api";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import {
  equalizerStore,
  useEqualizerStore,
} from "~/modules/equalizer/core/store";
import { setEQPreset } from "~/modules/equalizer/core/actions";

import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
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

  useEffect(() => {
    if (
      !playbackHydrated ||
      !preferenceHydrated ||
      !equalizerHydrated ||
      setupState !== "idle"
    ) {
      return;
    }

    (async () => {
      setSetupState("pending");
      GlyphToy.connect();

      // Ensure widget has up-to-date data as the Playback store isn't
      // immediately hydrated.
      await revalidateWidgets({ openApp: !playbackStore.getState().isPlaying });

      const { repeat, playingFrom, activeKey } = playbackStore.getState();
      const { restoreLastPosition, continuePlaybackOnDismiss } =
        preferenceStore.getState();
      if (restoreLastPosition) {
        playbackStore.setState({ _restoredTrackKey: activeKey });
      } else playbackStore.setState({ _hasRestoredPosition: true });

      // Ensure correct AudioBrowser settings.
      AudioBrowser.updateOptions(
        getAudioBrowserOptions({ continuePlaybackOnDismiss }),
      );
      if (repeat === RepeatModes.REPEAT_ONE) {
        AudioBrowser.setRepeatMode("track");
      }

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
  }, [playbackHydrated, preferenceHydrated, equalizerHydrated, setupState]);

  return setupState === "ready";
}
