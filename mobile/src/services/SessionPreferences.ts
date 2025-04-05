import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { TrackWithAlbum } from "~/db/schema";

import { getTrack } from "~/api/track";

import { wait } from "~/utils/promise";

interface SessionPreferencesStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  displayedTrack: (TrackWithAlbum & { _checked: number }) | null;
}

export const sessionPreferencesStore = createStore<SessionPreferencesStore>()(
  () => ({
    playbackSpeed: 1,
    volume: 1,

    displayedTrack: null,
  }),
);

export const useSessionPreferencesStore = <T>(
  selector: (state: SessionPreferencesStore) => T,
): T => useStore(sessionPreferencesStore, selector);

/** Displays the global track sheet. */
export async function presentTrackSheet(trackId: string) {
  try {
    const sheetTrack = await getTrack(trackId);
    sessionPreferencesStore.setState({
      displayedTrack: { ...sheetTrack, _checked: Date.now() },
    });
    await wait(25); // Let content get rendered in the sheet.
    TrueSheet.present("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionPreferencesStore.setState({ displayedTrack: null });
  }
}
