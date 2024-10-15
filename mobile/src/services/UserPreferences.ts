/**
 * Store representing user preferences.
 *
 * This file contains classes containing helpers to manipulate the store.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { Appearance } from "react-native";
import { useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import i18next from "@/modules/i18n";
import { LANGUAGES } from "@/modules/i18n/constants";
import { RecentList } from "@/modules/media/services/Music";

import { clearAllQueries } from "@/lib/react-query";

//#region Zustand Store
//#region UserPreferencesStore Interface
interface UserPreferencesStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  setHasHydrated: (newState: boolean) => void;

  /** Language code of the displayed content. */
  language: string;
  setLanguage: (languageCode: string) => void;

  /** "Color" the overall app will look like. */
  theme: "light" | "dark" | "system";
  setTheme: (newTheme: "light" | "dark" | "system") => void;
  /** Font used for some accent text (ie: major headings). */
  accentFont: "NDot" | "NType";
  setAccentFont: (newFont: "NDot" | "NType") => void;

  /** Minimum number of seconds a track needs to have to be saved. */
  minSeconds: number;

  /** Directories we'll limit to when looking for tracks. */
  listAllow: string[];
  /** Directories we'll ignore when looking for tracks. */
  listBlock: string[];

  /** Percentage of device volume audio will be outputted with. */
  volume: number;
}
//#endregion

//#region Fields we don't want to store in AsyncStorage
const OMITTED_FIELDS: string[] = [
  "_hasHydrated",
  "setHasHydrated",
  "setLanguage",
  "setTheme",
  "setAccentFont",
] satisfies Array<keyof UserPreferencesStore>;
//#endregion

//#region Store Creation
export const userPreferencesStore = createStore<UserPreferencesStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        _hasHydrated: false as boolean,
        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },

        language: "",
        setLanguage: (languageCode) => {
          set({ language: languageCode });
        },

        theme: "system",
        setTheme: (newTheme) => {
          set({ theme: newTheme });
        },
        accentFont: "NType",
        setAccentFont: (newFont) => {
          set({ accentFont: newFont });
        },

        minSeconds: 15,

        listAllow: [],
        listBlock: [],

        volume: 1,
      }),
      {
        name: "music::user-preferences",
        storage: createJSONStorage(() => AsyncStorage),
        // Only store some fields in AsyncStorage.
        partialize: (state) =>
          Object.fromEntries(
            Object.entries(state).filter(
              ([key]) => !OMITTED_FIELDS.includes(key),
            ),
          ),
        // Listen to when the store is hydrated.
        onRehydrateStorage: () => {
          console.log("[User Preferences Store] Re-hydrating storage.");
          return (state, error) => {
            if (error) console.log("[User Preferences Store]", error);
            else {
              console.log("[User Preferences Store] Completed with:", state);
              state?.setHasHydrated(true);

              // Set app theme on initialization.
              if (state?.theme && state.theme !== "system") {
                Appearance.setColorScheme(state.theme);
              }

              // Try to use device language if no language is specified.
              if (state?.language === "") {
                const deviceLangCode = getLocales()[0]?.languageCode || "en";
                // See if we support the device language.
                const exists = LANGUAGES.some(
                  ({ code }) => code === deviceLangCode,
                );
                state.setLanguage(exists ? deviceLangCode : "en");
              }
            }
          };
        },
      },
    ),
  ),
);
//#endregion

//#region Custom Hook
export const useUserPreferencesStore = <T>(
  selector: (state: UserPreferencesStore) => T,
): T => useStore(userPreferencesStore, selector);
//#endregion
//#endregion

//#region Subscriptions
/** Set the app's language from what's stored in AsyncStorage. */
userPreferencesStore.subscribe(
  (state) => state.language,
  async (languageCode) => {
    // Set the language used by the app.
    await i18next.changeLanguage(languageCode);
    // Make sure our queries that use translated values are updated.
    clearAllQueries();
    // Make sure the recent list data is also updated as we don't get
    // it from React Query.
    RecentList.refresh();
  },
);
//#endregion
