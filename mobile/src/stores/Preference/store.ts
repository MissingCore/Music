import { getLocales } from "expo-localization";
import { Uniwind } from "uniwind";
import { useStore } from "zustand";

import i18next from "~/modules/i18n";
import { LANGUAGES } from "~/modules/i18n/constants";

import { createPersistedStore } from "~/lib/zustand";
import type { PreferenceStore } from "./constants";
import { OmittedFields } from "./constants";
import { resolveLanguageConfigs } from "./utils";

export const preferenceStore = createPersistedStore<PreferenceStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async (state) => {
      // Set app theme on initialization.
      Uniwind.setTheme(state.theme);
      // Try to use device language if no language is specified.
      await resolveLanguageConfigs(
        state.language || getLocales()[0]?.languageTag || "en",
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

    theme: "system",
    accentFont: "NType",
    primaryFont: "Roboto",

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

    minAlbumLength: 0,
    miniplayerGestures: false,
    nowPlayingDesign: "vinyl",

    quickScroll: true,

    playbackDelay: 0,

    continuePlaybackOnDismiss: false,
    repeatOnSkip: false,
    restoreLastPosition: true,

    rescanOnLaunch: true,

    listAllow: [],
    listBlock: [],
    minSeconds: 15,
    separators: [],

    checkForUpdates: false,
    rcNotification: false,

    //! Experimental Features
    ignoreInterrupt: false,
    smoothPlaybackTransition: true,
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
