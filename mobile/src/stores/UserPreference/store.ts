import { getLocales } from "expo-localization";
import { Appearance, I18nManager } from "react-native";
import { useStore } from "zustand";

import i18next from "~/modules/i18n";
import { LANGUAGES } from "~/modules/i18n/constants";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import type { UserPreferenceStore } from "./constants";
import { OmittedFields } from "./constants";

export const userPreferenceStore =
  createPersistedSubscribedStore<UserPreferenceStore>(
    (set) => ({
      _hasHydrated: false,
      _init: async (state) => {
        // Set app theme on initialization.
        if (state.theme !== "system") Appearance.setColorScheme(state.theme);
        // Try to use device language if no language is specified.
        if (state.language === "") {
          await i18next.changeLanguage(getLocales()[0]?.languageTag || "en");
          I18nManager.allowRTL(i18next.dir() === "rtl");
          I18nManager.forceRTL(i18next.dir() === "rtl");
          const usedLanguage = i18next.resolvedLanguage;
          // Ensured the resolved value exists.
          const exists = LANGUAGES.some((l) => l.code === usedLanguage);
          set({ language: exists && usedLanguage ? usedLanguage : "en" });
        }
        set({ _hasHydrated: true });
      },

      language: "",
      ignoreRTLLayout: false,

      theme: "system",
      accentFont: "NType",
      primaryFont: "Roboto",

      minAlbumLength: 0,
      miniplayerGestures: false,
      nowPlayingDesign: "vinyl",

      homeTab: "home",
      tabsOrder: ["home", "folder", "playlist", "track", "album", "artist"],
      tabsVisibility: {
        album: true,
        artist: true,
        folder: true,
        home: true,
        playlist: true,
        track: true,
      },

      playbackDelay: 0,

      repeatOnSkip: false,
      restoreLastPosition: true,

      listAllow: [],
      listBlock: [],
      minSeconds: 15,

      rcNotification: false,

      //! Experimental Features
      continuePlaybackOnDismiss: false,
      ignoreInterrupt: false,
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
          if (error) console.log("[User Preferences Store]", error);
          else state?._init(state);
        };
      },
    },
  );

export function useUserPreferenceStore<T>(
  selector: (s: UserPreferenceStore) => T,
): T {
  return useStore(userPreferenceStore, selector);
}
