import { SheetManager } from "react-native-actions-sheet";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { TrackWithAlbum } from "~/db/schema";

import { getTrack } from "~/api/track";

import { wait } from "~/utils/promise";

interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  /** Track displayed in global track sheet. */
  displayedTrack: (TrackWithAlbum & { _checked: number }) | null;
}

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,
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
    await wait(25); // Let content get rendered in the sheet.
    SheetManager.show("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionStore.setState({ displayedTrack: null });
  }
}
