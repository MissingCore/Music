import BackgroundTimer from "@boterop/react-native-background-timer";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { TrackWithAlbum } from "~/db/schema";

import { getTrack } from "~/api/track";
import { MusicControls } from "~/modules/media/services/Playback";

interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  /** Track displayed in global track sheet. */
  displayedTrack: (TrackWithAlbum & { _checked: number }) | null;

  /** Stores the current sleep timer. */
  sleepTimer: ReturnType<typeof BackgroundTimer.setTimeout> | null;
  /** Epoch time where this sleep timer will end. */
  endAt: number | null;
  /** Create a sleep timer. */
  createSleepTimer: (minutes: number) => void;
  /** Clear the current sleep timer. */
  clearSleepTimer: () => void;
}

export const sessionStore = createStore<SessionStore>()((set, get) => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,

  sleepTimer: null,
  endAt: null,
  createSleepTimer: (minutes) => {
    const currTimer = get().sleepTimer;
    if (currTimer !== null) BackgroundTimer.clearTimeout(currTimer);
    const durationMS = minutes * 60 * 1000;
    const newTimer = BackgroundTimer.setTimeout(() => {
      MusicControls.stop();
      get().clearSleepTimer();
    }, durationMS);
    set({ sleepTimer: newTimer, endAt: Date.now() + durationMS });
  },
  clearSleepTimer: () => {
    const currTimer = get().sleepTimer;
    if (currTimer !== null) BackgroundTimer.clearTimeout(currTimer);
    set({ sleepTimer: null, endAt: null });
  },
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
    TrueSheet.present("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionStore.setState({ displayedTrack: null });
  }
}
