import { getLocales } from "expo-localization";
import { useMemo } from "react";
import { Appearance } from "react-native";
import { useStore } from "zustand";

import i18next from "~/modules/i18n";
import { LANGUAGES } from "~/modules/i18n/constants";
import { musicStore } from "~/modules/media/services/Music";
import { RecentList } from "~/modules/media/services/RecentList";

import { clearAllQueries } from "~/lib/react-query";
import { createPersistedSubscribedStore } from "~/lib/zustand";
import { getSourceName } from "~/modules/media/helpers/data";

/** Options for app themes. */
export const ThemeOptions = ["light", "dark", "system"] as const;
/** Options for app primary font. */
export const PrimaryFontOptions = ["Roboto", "Geist Mono"] as const;
/** Options for app accent font. */
export const AccentFontOptions = [
  ...["NDot", "NType"],
  ...PrimaryFontOptions,
] as const;
/** Options for "Now Playing" screen designs. */
export const NowPlayingDesignOptions = ["vinyl", "vinylOld", "plain"] as const;
/** Options for the tabs we can reorder. */
export type OrderableTab = "album" | "artist" | "folder" | "playlist" | "track";

//#region Zustand Store
//#region UserPreferencesStore Interface
interface UserPreferencesStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Initialize state that weren't initialized from subscriptions. */
  _init: (state: UserPreferencesStore) => void;

  /** Language code of the displayed content. */
  language: string;

  /** "Color" the overall app will look like. */
  theme: (typeof ThemeOptions)[number];
  /** Font used for some accent text (ie: major headings). */
  accentFont: (typeof AccentFontOptions)[number];
  /** Font used for text. */
  primaryFont: (typeof PrimaryFontOptions)[number];

  /** Design used for the "Now Playing" screen. */
  nowPlayingDesign: (typeof NowPlayingDesignOptions)[number];

  /** Order of tabs on the home screen. */
  tabsOrder: OrderableTab[];
  /** Visibility of the tabs on the home screen. */
  tabsVisibility: Record<OrderableTab, boolean>;

  /** Whether we'll show the "Recently Played" section on the home screen. */
  showRecent: boolean;

  /** If tips to alert the users of features will be displayed. */
  visualTips: boolean;

  /** Whether we'll continue playback through any interruptions. */
  ignoreInterrupt: boolean;
  /** Whether we stay on "Repeat One" mode when we skip. */
  repeatOnSkip: boolean;

  /** Whether we'll keep track of the last played position. */
  saveLastPosition: boolean;

  /** Directories we'll limit to when looking for tracks. */
  listAllow: string[];
  /** Directories we'll ignore when looking for tracks. */
  listBlock: string[];
  /** Minimum number of seconds a track needs to have to be saved. */
  minSeconds: number;
}
//#endregion

//#region Fields we don't want to store in AsyncStorage
const OMITTED_FIELDS: string[] = ["_hasHydrated", "_init"] satisfies Array<
  keyof UserPreferencesStore
>;
//#endregion

//#region Store Creation
export const userPreferencesStore =
  createPersistedSubscribedStore<UserPreferencesStore>(
    (set) => ({
      _hasHydrated: false,
      _init: async (state) => {
        // Set app theme on initialization.
        if (state.theme !== "system") Appearance.setColorScheme(state.theme);
        // Try to use device language if no language is specified.
        if (state.language === "") {
          await i18next.changeLanguage(getLocales()[0]?.languageTag || "en");
          const usedLanguage = i18next.resolvedLanguage;
          // Ensured the resolved value exists.
          const exists = LANGUAGES.some((l) => l.code === usedLanguage);
          set({ language: exists && usedLanguage ? usedLanguage : "en" });
        }
        set({ _hasHydrated: true });
      },

      language: "",

      theme: "system",
      accentFont: "NType",
      primaryFont: "Roboto",

      nowPlayingDesign: "vinyl",

      tabsOrder: ["folder", "playlist", "track", "album", "artist"],
      tabsVisibility: {
        album: true,
        artist: true,
        folder: true,
        playlist: true,
        track: true,
      },

      showRecent: true,

      visualTips: true,

      ignoreInterrupt: false,
      repeatOnSkip: false,

      saveLastPosition: true,

      listAllow: [],
      listBlock: [],
      minSeconds: 15,
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

/** Return tabs that are displayed or hidden. */
export function useTabsByVisibility() {
  const tabsOrder = useUserPreferencesStore((state) => state.tabsOrder);
  const tabsVisibility = useUserPreferencesStore(
    (state) => state.tabsVisibility,
  );

  return useMemo(
    () => ({
      displayedTabs: tabsOrder.filter((tabName) => tabsVisibility[tabName]),
      hiddenTabs: tabsOrder.filter((tabName) => !tabsVisibility[tabName]),
    }),
    [tabsOrder, tabsVisibility],
  );
}
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
//#endregion
