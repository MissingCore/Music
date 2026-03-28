import type { Tab } from "./types";

//#region Theme
export const ThemeOptions = ["light", "dark", "system"] as const;

export type Theme = (typeof ThemeOptions)[number];
//endregion

//#region Font
export const FontOptions = [
  "NDot",
  "NType",
  "Roboto",
  "Inter",
  "Geist Mono",
  "System",
] as const;

export type Font = (typeof FontOptions)[number];
//#endregion

//#region Now Playing Design
export const NowPlayingDesignOptions = ["plain", "vinyl", "vinylOld"] as const;

export type NowPlayingDesign = (typeof NowPlayingDesignOptions)[number];
//#endregion

//#region Store
export interface PreferenceStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: PreferenceStore) => Promise<void>;

  /** If the user has clicked "Start Scanning Tracks" in the onboarding flow. */
  completedOnboarding: boolean;

  /** Language code of the displayed content. */
  language: string;
  /** If we should use LTR layout with a RTL language. */
  forceLTR: boolean;

  theme: Theme;
  /** Font used for some accent text (ie: major headings). */
  accentFont: Font;
  /** Font used for text. */
  primaryFont: Font;

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
  /** If dragging the miniplayer down will reset the playback store. */
  dragClearPlayback: boolean;
  /** Design used for the Now Playing screen. */
  nowPlayingDesign: NowPlayingDesign;

  /** Shows button to add track to queue on `<Track />` item. */
  quickAddQueue: boolean;
  /** Show functional Nothing-styled scrollbar on supported screens. */
  quickScroll: boolean;
  /** If we use `contentFit="cover"` for artwork. */
  squareArtwork: boolean;

  /** Delay before next track is naturally played. */
  playbackDelay: number;

  /** If playback will continue when we dismiss the app. */
  continuePlaybackOnDismiss: boolean;
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
  /** Strings used to determine multi-value items. */
  separators: string[];

  /** If we should check for updates on app launch. */
  checkForUpdates: boolean;
  /** If the user should be notified about `-rc` versions. */
  rcNotification: boolean;

  //! Experimental Features
  /**
   * Tracks added via "Play Next" will attempt to added after the previous
   * added track. Tracking resets after app session ends.
   */
  queueAwareNext: boolean;
  /** Utilize a waveform slider on the Now Playing screen. */
  waveformSlider: boolean;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
] satisfies Array<keyof PreferenceStore>;
//#endregion
