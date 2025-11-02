import TrackPlayer from "@weights-ai/react-native-track-player";
import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

import { userPreferenceStore } from "../store";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";

export async function toggleContinuePlaybackOnDismiss() {
  const nextState = !userPreferenceStore.getState().continuePlaybackOnDismiss;
  userPreferenceStore.setState({ continuePlaybackOnDismiss: nextState });
  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ continuePlaybackOnDismiss: nextState }),
  );
}

export function toggleIgnoreInterrupt() {
  userPreferenceStore.setState((prev) => ({
    ignoreInterrupt: !prev.ignoreInterrupt,
  }));
}

export function toggleIgnoreRTLLayout() {
  const nextState = !userPreferenceStore.getState().ignoreRTLLayout;
  userPreferenceStore.setState({ ignoreRTLLayout: nextState });
  I18nManager.allowRTL(nextState ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(nextState ? false : i18next.dir() === "rtl");
}

export function toggleMiniplayerGestures() {
  userPreferenceStore.setState((prev) => ({
    miniplayerGestures: !prev.miniplayerGestures,
  }));
}

export function toggleRCNotification() {
  userPreferenceStore.setState((prev) => ({
    rcNotification: !prev.rcNotification,
  }));
}

export function toggleRepeatOnSkip() {
  userPreferenceStore.setState((prev) => ({
    repeatOnSkip: !prev.repeatOnSkip,
  }));
}

export function toggleRestoreLastPosition() {
  userPreferenceStore.setState((prev) => ({
    restoreLastPosition: !prev.restoreLastPosition,
  }));
}
