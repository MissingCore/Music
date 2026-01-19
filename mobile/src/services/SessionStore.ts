import { TrueSheet } from "@lodev09/react-native-true-sheet";
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
  displayedTrack: (TrackWithRelations & { _checked: number }) | null;
  /** Artists displayed in global artist sheet. */
  displayedArtists: { artists: Artist[]; popScreen: boolean } | null;

  /** Waveform data for the active track. */
  activeWaveformContext: WaveformSample | null;
}

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,
  displayedArtists: null,

  activeWaveformContext: null,
}));

export const useSessionStore = <T>(selector: (state: SessionStore) => T): T =>
  useStore(sessionStore, selector);

//#region Track Sheet
/** Displays the global track sheet. */
export async function presentTrackSheet(trackId: string) {
  try {
    const sheetTrack = await getTrack(trackId);
    sessionStore.setState({
      displayedTrack: { ...sheetTrack, _checked: Date.now() },
    });
    await wait(1);
    TrueSheet.present("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionStore.setState({ displayedTrack: null });
  }
}
//#endregion

//#region Artist Sheet
/** Displays the global artist sheet. */
export async function presentArtistsSheet(
  artistNames: string[],
  /** Calls `goBack` on current screen before navigating to artist screen. */
  popScreen = false,
) {
  try {
    const sheetArtists = await throwIfNoResults(
      db.query.artists.findMany({
        where: (fields, { inArray }) => inArray(fields.name, artistNames),
        orderBy: (fields) => iAsc(fields.name),
      }),
    );
    sessionStore.setState({
      displayedArtists: { artists: sheetArtists, popScreen },
    });
    await wait(1);
    TrueSheet.present("ArtistsSheet");
  } catch {
    sessionStore.setState({ displayedArtists: null });
  }
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
