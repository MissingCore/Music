import type { Tab } from "./types";

//#region Theme
export const ThemeOptions = ["light", "dark", "system"] as const;

export type Theme = (typeof ThemeOptions)[number];
//endregion

//#region Font
export const PrimaryFontOptions = ["Roboto", "Inter", "Geist Mono"] as const;

export const AccentFontOptions = [
  ...["NDot", "NType"],
  ...PrimaryFontOptions,
] as const;

export type PrimaryFont = (typeof PrimaryFontOptions)[number];

export type AccentFont = (typeof AccentFontOptions)[number];
//#endregion

//#region Now Playing Design
export const NowPlayingDesignOptions = ["vinyl", "vinylOld", "plain"] as const;

export type NowPlayingDesign = (typeof NowPlayingDesignOptions)[number];
//#endregion

//#region Store
export interface PreferenceStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: PreferenceStore) => Promise<void>;

  /** Language code of the displayed content. */
  language: string;
  /** If we should use LTR layout with a RTL language. */
  ignoreRTLLayout: boolean;

  theme: Theme;
  /** Font used for some accent text (ie: major headings). */
  accentFont: AccentFont;
  /** Font used for text. */
  primaryFont: PrimaryFont;

  /** Tab that we open up to on app launch. */
  homeTab: Tab;
  /** Order of tabs on the Home screen. */
  tabsOrder: Tab[];
  /** Visibility of the tabs on the Home screen. */
  tabsVisibility: Record<Tab, boolean>;

  /** Minimum number of tracks for album to show in Albums screen. */
  minAlbumLength: number;
  /** If we want swipe controls on the miniplayer. */
  miniplayerGestures: boolean;
  /** Design used for the Now Playing screen. */
  nowPlayingDesign: NowPlayingDesign;

  /** Show functional Nothing-styled scrollbar on supported screens. */
  quickScroll: boolean;

  /** Delay before next track is naturally played. */
  playbackDelay: number;

  /** Whether we stay on "Repeat One" mode when we skip. */
  repeatOnSkip: boolean;
  /** Whether we'll restore the track to the last played position. */
  restoreLastPosition: boolean;

  /** If we should rescan the library on app launch. */
  rescanOnLaunch: boolean;

  /** Directories we'll limit to when looking for tracks. */
  listAllow: string[];
  /** Directories we'll ignore when looking for tracks. */
  listBlock: string[];
  /** Minimum number of seconds a track needs to have to be saved. */
  minSeconds: number;

  /** If the user should be notified about `-rc` versions. */
  rcNotification: boolean;

  //! Experimental Features
  /** If playback will continue when we dismiss the app. */
  continuePlaybackOnDismiss: boolean;
  /** Whether we'll continue playback through any interruptions. */
  ignoreInterrupt: boolean;
  /** Display seek bar with audio waves in "Now Playing" screen. */
  visualizedSeekBar: boolean;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
] satisfies Array<keyof PreferenceStore>;
//#endregion
