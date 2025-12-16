import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

/** Ensure `i18next` & React Native is aware of the current app language. */
export async function resolveLanguageConfigs(
  language: string,
  forceLTR = false,
) {
  await i18next.changeLanguage(language);
  if (!forceLTR) {
    I18nManager.allowRTL(i18next.dir() === "rtl");
    I18nManager.forceRTL(i18next.dir() === "rtl");
  }
}
