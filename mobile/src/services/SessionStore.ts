import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { db } from "~/db";
import type { TrackWithRelations, WaveformSample } from "~/db/schema";

import { getTrack } from "~/api/track";

import { wait } from "~/utils/promise";

interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  /** Track displayed in global track sheet. */
  displayedTrack: (TrackWithRelations & { _checked: number }) | null;

  /** Waveform data for the active track. */
  activeWaveformContext: WaveformSample | null;
}

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,

  activeWaveformContext: null,
}));

export const useSessionStore = <T>(selector: (state: SessionStore) => T): T =>
  useStore(sessionStore, selector);

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

/** Find, return, and set the cached waveform data in the Session store. */
export async function findAndSetCachedWaveform(trackId: string) {
  const cachedWaveform = await db.query.waveformSamples.findFirst({
    where: (fields, { eq }) => eq(fields.trackId, trackId),
  });
  sessionStore.setState({ activeWaveformContext: cachedWaveform || null });
  return cachedWaveform;
}
