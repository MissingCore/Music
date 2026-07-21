// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { I18nManager } from "react-native";
import { Uniwind } from "uniwind";
import { useStore } from "zustand";

import { CAN_SENTRY_REPORT, CHECK_FOR_UPDATES } from "~/env";
import i18next from "~/modules/i18n";
import { LANGUAGES } from "~/modules/i18n/constants";

import { Sentry } from "~/lib/sentry";
import { createPersistedStore } from "~/lib/zustand";
import { getCustomTheme } from "~/modules/customization/theme/core/data";
import {
  formatCustomTheme,
  resolveCustomTheme,
} from "~/modules/customization/theme/utils";
import type { PreferenceStore } from "./constants";
import { OmittedFields } from "./constants";
import { resolveLanguageConfigs } from "./utils";

export const preferenceStore = createPersistedStore<PreferenceStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async (state) => {
      // Set app theme on initialization.
      try {
        if (state.activeCustomThemeId) {
          const activeCustomTheme = formatCustomTheme(
            await getCustomTheme(state.activeCustomThemeId),
          );
          resolveCustomTheme(activeCustomTheme);
          set({ activeCustomTheme });
        } else {
          Uniwind.setTheme(state.theme);
        }
      } catch (err) {
        //! FIXME: Temporary to see if we get a `no such table: custom_themes` error.
        if (CAN_SENTRY_REPORT) Sentry.captureException(err);

        // Reset custom theme if it no longer exists in the database.
        Uniwind.setTheme(state.theme);
        set({ activeCustomThemeId: null, activeCustomTheme: null });
      }

      // Try to use device language if no language is specified.
      await resolveLanguageConfigs(
        state.language ||
          // Get initial locale via React Native API.
          //  - https://github.com/facebook/react-native/issues/33577#issuecomment-1675373285
          I18nManager.getConstants().localeIdentifier?.replace("_", "-") ||
          "en",
        state.forceLTR,
      );
      if (state.language === "") {
        const usedLanguage = i18next.resolvedLanguage;
        // Ensured the resolved value exists.
        const exists = LANGUAGES.some((l) => l.code === usedLanguage);
        set({ language: exists && usedLanguage ? usedLanguage : "en" });
      }
      set({ _hasHydrated: true });
    },

    completedOnboarding: false,

    language: "",
    forceLTR: false,

    accentFont: "NType",
    primaryFont: "Roboto",
    theme: "system",
    activeCustomThemeId: null,
    activeCustomTheme: null,

    showNavbar: true,
    homeTab: "home",
    tabsOrder: [
      "home",
      "folder",
      "playlist",
      "track",
      "album",
      "artist",
      "genre",
    ],
    tabsVisibility: {
      album: true,
      artist: true,
      folder: true,
      genre: true,
      home: true,
      playlist: true,
      track: true,
    },

    gridColumnSize: 144,

    minAlbumLength: 0,

    miniplayerGestures: false,
    dragClearPlayback: false,

    nowPlayingDesign: "vinyl",
    nowPlayingArtworkControls: false,
    nowPlayingGestures: false,
    playbackDelay: 0,

    quickScroll: true,
    squareArtwork: true,

    continuePlaybackOnDismiss: false,
    repeatOnSkip: false,
    restoreLastPosition: true,
    quickAddQueue: false,
    quickFavorite: false,

    rescanOnLaunch: true,
    optimizedImageSave: true,

    listAllow: [],
    listBlock: [],
    minSeconds: 15,
    separators: [],

    //? Conditionally change default value based on distribution method.
    checkForUpdates: CHECK_FOR_UPDATES,
    rcNotification: false,

    //! Experimental Features
    mediaStoreScanner: false,
    downsamplingProcessor: true,
    queueAwareNext: false,
    waveformSlider: false,
  }),
  {
    name: "music::user-preferences",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => !OmittedFields.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Preference Store]", error);
        else state?._init(state);
      };
    },
  },
);

export function usePreferenceStore<T>(selector: (s: PreferenceStore) => T): T {
  return useStore(preferenceStore, selector);
}
