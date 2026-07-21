// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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

export const MinAlbumLengthConfig = {
  bound: { min: 1, max: 20 },
  clamp(value: number) {
    return clamp(this.bound.min, value, this.bound.max);
  },
};

export const PlaybackDelayConfig = {
  bound: { min: 0, max: 10 },
  clamp(value: number) {
    return clamp(this.bound.min, value, this.bound.max);
  },
};
