import TrackPlayer from "@weights-ai/react-native-track-player";
import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

import { preferenceStore } from "../store";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";

export async function toggleContinuePlaybackOnDismiss() {
  const nextState = !preferenceStore.getState().continuePlaybackOnDismiss;
  preferenceStore.setState({ continuePlaybackOnDismiss: nextState });
  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ continuePlaybackOnDismiss: nextState }),
  );
}

export function toggleQuickScroll() {
  preferenceStore.setState((prev) => ({ quickScroll: !prev.quickScroll }));
}

export function toggleIgnoreInterrupt() {
  preferenceStore.setState((prev) => ({
    ignoreInterrupt: !prev.ignoreInterrupt,
  }));
}

export function toggleIgnoreRTLLayout() {
  const nextState = !preferenceStore.getState().ignoreRTLLayout;
  preferenceStore.setState({ ignoreRTLLayout: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
}

export function toggleMiniplayerGestures() {
  preferenceStore.setState((prev) => ({
    miniplayerGestures: !prev.miniplayerGestures,
  }));
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

export function toggleVisualizedSeekBar() {
  preferenceStore.setState((prev) => ({
    visualizedSeekBar: !prev.visualizedSeekBar,
  }));
}
