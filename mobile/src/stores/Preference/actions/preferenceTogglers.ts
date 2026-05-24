import AsyncStorage from "expo-sqlite/kv-store";
import { I18nManager } from "react-native";
import AudioBrowser from "react-native-audio-browser";

import i18next from "~/modules/i18n";

import { preferenceStore } from "../store";
import { playbackStore } from "../../Playback/store";
import { findAndSetCachedWaveform } from "../../Session/actions";

import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";

type ToggleableKey =
  | "checkForUpdates"
  | "dragClearPlayback"
  | "quickAddQueue"
  | "quickFavorite"
  | "quickScroll"
  | "miniplayerGestures"
  | "optimizedImageSave"
  | "rcNotification"
  | "rescanOnLaunch"
  | "repeatOnSkip"
  | "restoreLastPosition"
  | "showLyrics"
  | "showNavbar"
  | "squareArtwork";

export function toggleKey(key: ToggleableKey) {
  return () => {
    preferenceStore.setState((prev) => ({ [key]: !prev[key] }));
  };
}

export async function toggleContinuePlaybackOnDismiss() {
  const nextState = !preferenceStore.getState().continuePlaybackOnDismiss;
  preferenceStore.setState({ continuePlaybackOnDismiss: nextState });
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({ continuePlaybackOnDismiss: nextState }),
  );
}

export async function toggleDownsamplingProcessor() {
  const prevState = preferenceStore.getState().downsamplingProcessor;
  preferenceStore.setState({ downsamplingProcessor: !prevState });
  // Update a dedicated value in `AsyncStorage` as the value stored in
  // `preferenceStore` may not be hydrated in time by the time we use it.
  await AsyncStorage.setItem("downsamplingProcessor", `${!prevState}`);
}

export function toggleForceLTR() {
  const nextState = !preferenceStore.getState().forceLTR;
  preferenceStore.setState({ forceLTR: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
}

export function toggleQueueAwareNext() {
  preferenceStore.setState((prev) => ({
    queueAwareNext: !prev.queueAwareNext,
  }));
  playbackStore.setState({ numQueuedNext: 0 });
}

export async function toggleWaveformSlider() {
  const nextState = !preferenceStore.getState().waveformSlider;
  preferenceStore.setState({ waveformSlider: nextState });

  const { activeTrack } = playbackStore.getState();
  if (activeTrack) await findAndSetCachedWaveform(activeTrack.id);
}
