import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";

/** Ensure `i18next` & React Native is aware of the current app language. */
export async function resolveLanguageConfigs(
  language: string,
  forceLTR = false,
) {
  await i18next.changeLanguage(language);
  // Also fire when language is LTR as if `forceLTR = true` and we're coming
  // from an RTL language, the next app launch will have the LTR language in
  // an RTL layout.
  if (!forceLTR || i18next.dir() === "ltr") {
    I18nManager.allowRTL(i18next.dir() === "rtl");
    I18nManager.forceRTL(i18next.dir() === "rtl");
  }
}
