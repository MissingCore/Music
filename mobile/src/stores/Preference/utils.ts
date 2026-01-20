import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

import { clamp } from "~/utils/number";

/** Ensure `i18next` & React Native is aware of the current app language. */
export async function resolveLanguageConfigs(
  language: string,
  forceLTR: boolean,
) {
  await i18next.changeLanguage(language);
  I18nManager.allowRTL(forceLTR ? false : i18next.dir() === "rtl");
  I18nManager.forceRTL(forceLTR ? false : i18next.dir() === "rtl");
}

export function clampPlaybackDelay(value: number) {
  return clamp(0, value, 10);
}
