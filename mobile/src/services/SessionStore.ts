import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { NavigationProp } from "@react-navigation/native";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { db } from "~/db";
import type { Artist, TrackWithRelations, WaveformSample } from "~/db/schema";

import { getTrack } from "~/api/track";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { wait } from "~/utils/promise";

interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  /** Track displayed in global track sheet. */
  displayedTrack: TrackWithRelations | null;
  /** Artists displayed in global artist sheet. */
  displayedArtists: { artists: Artist[]; popStrategy?: PopStrategy } | null;

  /** If lyrics will be displyad over the artwork on the Now Playing screen. */
  showLyrics: boolean;
  /** Waveform data for the active track. */
  activeWaveformContext: WaveformSample | null;
}

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,
  displayedArtists: null,

  showLyrics: false,
  activeWaveformContext: null,
}));

export const useSessionStore = <T>(selector: (state: SessionStore) => T): T =>
  useStore(sessionStore, selector);

//#region Track Sheet
/** Displays the global track sheet. */
export async function presentTrackSheet(trackId: string) {
  try {
    const sheetTrack = await getTrack(trackId);
    sessionStore.setState({ displayedTrack: sheetTrack });
    await wait(1);
    TrueSheet.present("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionStore.setState({ displayedTrack: null });
  }
}
//#endregion

//#region Artist Sheet
/**
 * The screen popping strategies offered when navigating to the artist screen.
 * - `popTo`: Uses the `pop` option in `navigate()`.
 * - `popScreen`: Calls `goBack()` on current screen before navigating.
 */
export type PopStrategy = "popTo" | "popScreen";

/** Displays the global artist sheet. */
export async function presentArtistsSheet(
  artistNames: string[],
  /** Optional screen popping strategy to navigate to the artist screen. */
  popStrategy?: PopStrategy,
) {
  try {
    const sheetArtists = await throwIfNoResults(
      db.query.artists.findMany({
        where: (fields, { inArray }) => inArray(fields.name, artistNames),
        orderBy: (fields) => iAsc(fields.name),
      }),
    );
    sessionStore.setState({
      displayedArtists: { artists: sheetArtists, popStrategy },
    });
    await wait(1);
    TrueSheet.present("ArtistsSheet");
  } catch {
    sessionStore.setState({ displayedArtists: null });
  }
}

export function navigateToArtist(
  navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState">,
  id: string,
  popStrategy?: PopStrategy,
) {
  // Pops current screen before navigating to artist screen.
  // Useful when used on "Now Playing" screen.
  if (popStrategy === "popScreen") navigation.goBack();
  // `pop` option is useful in the following navigation scenario:
  // "Artist" -> "Album" -> "Artist".
  navigation.navigate("Artist", { id }, { pop: popStrategy === "popTo" });
}
//#endregion

//#region Waveform
/** Find, return, and set the cached waveform data in the Session store. */
export async function findAndSetCachedWaveform(trackId: string) {
  const cachedWaveform = await db.query.waveformSamples.findFirst({
    where: (fields, { eq }) => eq(fields.trackId, trackId),
  });
  sessionStore.setState({ activeWaveformContext: cachedWaveform || null });
  return cachedWaveform;
}
//#endregion
