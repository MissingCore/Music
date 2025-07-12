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
  sleepTimerRef: ReturnType<typeof BackgroundTimer.setTimeout> | null;
  /** Length of sleep timer in minutes. */
  sleepTimerDuration: number;
  /** Epoch time where this sleep timer will end. */
  sleepTimerEndAt: number | null;
  /** Create a sleep timer. */
  createSleepTimer: (minutes: number) => void;
  /** Clear the current sleep timer. */
  clearSleepTimer: () => void;
}

export const sessionStore = createStore<SessionStore>()((set, get) => ({
  playbackSpeed: 1,
  volume: 1,

  displayedTrack: null,

  sleepTimerRef: null,
  sleepTimerDuration: 5,
  sleepTimerEndAt: null,
  createSleepTimer: (minutes) => {
    const currTimer = get().sleepTimerRef;
    if (currTimer !== null) BackgroundTimer.clearTimeout(currTimer);
    const durationMS = minutes * 60 * 1000;
    const newTimer = BackgroundTimer.setTimeout(() => {
      MusicControls.stop();
      get().clearSleepTimer();
    }, durationMS);
    set({
      sleepTimerRef: newTimer,
      sleepTimerDuration: minutes,
      sleepTimerEndAt: Date.now() + durationMS,
    });
  },
  clearSleepTimer: () => {
    const currTimer = get().sleepTimerRef;
    if (currTimer !== null) BackgroundTimer.clearTimeout(currTimer);
    set({ sleepTimerRef: null, sleepTimerEndAt: null });
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
