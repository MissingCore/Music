import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

import { userPreferenceStore } from "../store";

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
