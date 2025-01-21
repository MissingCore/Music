import { getLocales } from "expo-localization";
import { Appearance } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useStore } from "zustand";

import i18next from "@/modules/i18n";
import { LANGUAGES } from "@/modules/i18n/constants";
import { musicStore } from "@/modules/media/services/Music";
import { RecentList } from "@/modules/media/services/RecentList";

import { clearAllQueries } from "@/lib/react-query";
import { createPersistedSubscribedStore } from "@/lib/zustand";
import { moveArray } from "@/utils/object";
import type { Permutations } from "@/utils/types";
import { getSourceName } from "@/modules/media/helpers/data";

/** Options for app themes. */
export const ThemeOptions = ["light", "dark", "system"] as const;
/** Options for app accent font. */
export const FontOptions = ["NDot", "NType", "Roboto"] as const;
/** Options for "Now Playing" screen designs. */
export const NowPlayingDesignOptions = ["vinyl", "plain"] as const;
/** Options for the tabs we can reorder. */
export const OrderableTabs = [
  "album",
  "artist",
  "folder",
  "playlist",
  "track",
] as const;

//#region Zustand Store
//#region UserPreferencesStore Interface
interface UserPreferencesStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Initialize state that weren't initialized from subscriptions. */
  _init: (state: UserPreferencesStore) => void;

  /** Language code of the displayed content. */
  language: string;
  setLanguage: (languageCode: string) => void;

  /** "Color" the overall app will look like. */
  theme: (typeof ThemeOptions)[number];
  setTheme: (newTheme: UserPreferencesStore["theme"]) => void;
  /** Font used for some accent text (ie: major headings). */
  accentFont: (typeof FontOptions)[number];
  setAccentFont: (newFont: UserPreferencesStore["accentFont"]) => void;

  /** Design used for the "Now Playing" screen. */
  nowPlayingDesign: (typeof NowPlayingDesignOptions)[number];
  setNowPlayingDesign: (
    newDesign: UserPreferencesStore["nowPlayingDesign"],
  ) => void;
  /** Order of tabs on the home screen. */
  homeTabsOrder: Permutations<(typeof OrderableTabs)[number]>;
  moveTab: (fromIndex: number, toIndex: number) => void;

  /** Minimum number of seconds a track needs to have to be saved. */
  minSeconds: number;

  /** Directories we'll limit to when looking for tracks. */
  listAllow: string[];
  /** Directories we'll ignore when looking for tracks. */
  listBlock: string[];

  /** Percentage of device volume audio will be outputted with. */
  volume: number;
  setVolume: (newVolume: number) => void;
}
//#endregion

//#region Fields we don't want to store in AsyncStorage
const OMITTED_FIELDS: string[] = [
  "_hasHydrated",
  "_init",
  "setLanguage",
  "setTheme",
  "setAccentFont",
  "setNowPlayingDesign",
  "setVolume",
] satisfies Array<keyof UserPreferencesStore>;
//#endregion

//#region Store Creation
export const userPreferencesStore =
  createPersistedSubscribedStore<UserPreferencesStore>(
    (set) => ({
      _hasHydrated: false as boolean,
      _init: async (state) => {
        // Set app theme on initialization.
        if (state.theme !== "system") Appearance.setColorScheme(state.theme);
        // Try to use device language if no language is specified.
        if (state.language === "") {
          await i18next.changeLanguage(getLocales()[0]?.languageTag || "en");
          const usedLanguage = i18next.resolvedLanguage;
          // Ensured the resolved value exists.
          const exists = LANGUAGES.some((l) => l.code === usedLanguage);
          state.setLanguage(exists && usedLanguage ? usedLanguage : "en");
        }
        set({ _hasHydrated: true });
      },

      language: "",
      setLanguage: (languageCode) => set({ language: languageCode }),

      theme: "system",
      setTheme: (newTheme) => set({ theme: newTheme }),
      accentFont: "NType",
      setAccentFont: (newFont) => set({ accentFont: newFont }),

      nowPlayingDesign: "vinyl",
      setNowPlayingDesign: (newDesign) => set({ nowPlayingDesign: newDesign }),
      homeTabsOrder: ["folder", "playlist", "track", "album", "artist"],
      moveTab: (fromIndex: number, toIndex: number) => {
        set(({ homeTabsOrder }) => {
          const newOrder = moveArray(homeTabsOrder, { fromIndex, toIndex });
          return {
            homeTabsOrder: newOrder as UserPreferencesStore["homeTabsOrder"],
          };
        });
      },

      minSeconds: 15,

      listAllow: [],
      listBlock: [],

      volume: 1,
      setVolume: (newVolume) => set({ volume: newVolume }),
    }),
    {
      name: "music::user-preferences",
      // Only store some fields in AsyncStorage.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !OMITTED_FIELDS.includes(key),
          ),
        ),
      // Listen to when the store is hydrated.
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) console.log("[User Preferences Store]", error);
          else state?._init(state);
        };
      },
      skipHydration: true,
    },
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
    // Make sure to refresh the playing source name if it's one of the favorite playlists.
    const { playingSource } = musicStore.getState();
    if (playingSource) {
      musicStore.setState({ sourceName: await getSourceName(playingSource) });
    }
  },
);

/** Set the internal volume used from what's stored in AsyncStorage. */
userPreferencesStore.subscribe(
  (state) => state.volume,
  async (volume) => {
    try {
      await TrackPlayer.setVolume(volume);
    } catch {}
  },
);
//#endregion
