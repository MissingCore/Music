import { getLocales } from "expo-localization";
import { Uniwind } from "uniwind";
import { useStore } from "zustand";

import i18next from "~/modules/i18n";
import { LANGUAGES } from "~/modules/i18n/constants";

import { throwIfNoResults } from "~/lib/drizzle";
import { createPersistedStore } from "~/lib/zustand";
import { getCustomFonts } from "~/modules/font/queries";
import { loadCustomFonts } from "~/modules/font/utils";
import { getCustomTheme, resolveCustomTheme } from "~/modules/theme/utils";
import type { PreferenceStore } from "./constants";
import { OmittedFields } from "./constants";
import { resolveLanguageConfigs } from "./utils";

export const preferenceStore = createPersistedStore<PreferenceStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async (state) => {
      // Load custom fonts.
      try {
        const customFonts = await getCustomFonts();
        await loadCustomFonts(customFonts);
      } catch (err) {
        console.log("[Preference Store] Failed to load custom fonts:", err);
      }

      // Set app theme on initialization.
      try {
        if (state.activeCustomThemeId) {
          const activeCustomTheme = await throwIfNoResults(
            getCustomTheme(state.activeCustomThemeId),
          );
          resolveCustomTheme(activeCustomTheme);
          set({ activeCustomTheme });
        } else {
          Uniwind.setTheme(state.theme);
        }
      } catch {
        // Reset custom theme if it no longer exists in the database.
        Uniwind.setTheme(state.theme);
        set({ activeCustomThemeId: null, activeCustomTheme: null });
      }

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

    minAlbumLength: 0,
    miniplayerGestures: false,
    dragClearPlayback: false,
    nowPlayingDesign: "vinyl",

    quickScroll: true,
    squareArtwork: true,

    playbackDelay: 0,

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

    checkForUpdates: false,
    rcNotification: false,

    //! Experimental Features
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
