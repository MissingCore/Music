import { I18nManager } from "react-native";
import TrackPlayer from "react-native-track-player";

import i18next from "~/modules/i18n";

import { preferenceStore } from "../store";
import { playbackStore } from "../../Playback/store";
import { findAndSetCachedWaveform } from "../../Session/actions";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";

export function toggleCheckForUpdates() {
  preferenceStore.setState((prev) => ({
    checkForUpdates: !prev.checkForUpdates,
  }));
}

export async function toggleContinuePlaybackOnDismiss() {
  const nextState = !preferenceStore.getState().continuePlaybackOnDismiss;
  preferenceStore.setState({ continuePlaybackOnDismiss: nextState });
  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ continuePlaybackOnDismiss: nextState }),
  );
}
export function toggleDragClearPlayback() {
  preferenceStore.setState((prev) => ({
    dragClearPlayback: !prev.dragClearPlayback,
  }));
}

export function toggleQuickAddQueue() {
  preferenceStore.setState((prev) => ({ quickAddQueue: !prev.quickAddQueue }));
}

export function toggleQuickScroll() {
  preferenceStore.setState((prev) => ({ quickScroll: !prev.quickScroll }));
}

export function toggleIgnoreInterrupt() {
  preferenceStore.setState((prev) => ({
    ignoreInterrupt: !prev.ignoreInterrupt,
  }));
}

export function toggleForceLTR() {
  const nextState = !preferenceStore.getState().forceLTR;
  preferenceStore.setState({ forceLTR: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
}

export function toggleMiniplayerGestures() {
  preferenceStore.setState((prev) => ({
    miniplayerGestures: !prev.miniplayerGestures,
  }));
}

export function toggleQueueAwareNext() {
  preferenceStore.setState((prev) => ({
    queueAwareNext: !prev.queueAwareNext,
  }));
  playbackStore.setState({ numQueuedNext: 0 });
}

export function toggleRCNotification() {
  preferenceStore.setState((prev) => ({
    rcNotification: !prev.rcNotification,
  }));
}

export function toggleRescanOnLaunch() {
  preferenceStore.setState((prev) => ({
    rescanOnLaunch: !prev.rescanOnLaunch,
  }));
}

export function toggleRepeatOnSkip() {
  preferenceStore.setState((prev) => ({ repeatOnSkip: !prev.repeatOnSkip }));
}

export function toggleRestoreLastPosition() {
  preferenceStore.setState((prev) => ({
    restoreLastPosition: !prev.restoreLastPosition,
  }));
}

export function toggleSmoothPlaybackTransition() {
  preferenceStore.setState((prev) => ({
    smoothPlaybackTransition: !prev.smoothPlaybackTransition,
  }));
}

export async function toggleWaveformSlider() {
  const nextState = !preferenceStore.getState().waveformSlider;
  preferenceStore.setState({ waveformSlider: nextState });

  const { activeTrack } = playbackStore.getState();
  if (activeTrack) await findAndSetCachedWaveform(activeTrack.id);
}
