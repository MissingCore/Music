import BackgroundTimer from "@boterop/react-native-background-timer";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";

interface SleepTimerStore {
  /** Reference to current active timer. */
  ref: ReturnType<typeof BackgroundTimer.setTimeout> | null;

  /** Duration of timer in minutes. */
  duration: number;
  /** Epoch time where this timer will end. */
  endAt: number | null;

  /** If we should delay executing the sleep timer callback until the track finishes. */
  extension: boolean;
  toggleExtension: VoidFunction;

  /** Create a sleep timer. */
  create: (minutes: number) => void;
  /** Clear the current sleep timer. */
  clear: VoidFunction;
}

export const sleepTimerStore = createStore<SleepTimerStore>()((set, get) => ({
  ref: null,
  duration: 5,
  endAt: null,

  extension: false,
  toggleExtension: () => set((prev) => ({ extension: !prev.extension })),

  create: (minutes) => {
    const { extension, clear: clearSleepTimer } = get();
    clearSleepTimer();

    const durationMS = minutes * 60 * 1000;
    let timerRef: ReturnType<typeof BackgroundTimer.setTimeout>;
    timerRef = BackgroundTimer.setTimeout(() => {
      const { lastPosition, activeTrack } = playbackStore.getState();
      if (!extension || !activeTrack) {
        PlaybackControls.stop();
        clearSleepTimer();
      } else {
        const extensionMS = (activeTrack.duration - lastPosition) * 1000;
        timerRef = BackgroundTimer.setTimeout(() => {
          PlaybackControls.stop();
          clearSleepTimer();
        }, extensionMS);
      }
    }, durationMS);

    set({ ref: timerRef, duration: minutes, endAt: Date.now() + durationMS });
  },
  clear: () => {
    const { ref: currTimer } = get();
    if (currTimer !== null) BackgroundTimer.clearTimeout(currTimer);
    set({ ref: null, endAt: null });
  },
}));

export const useSleepTimerStore = <T>(
  selector: (state: SleepTimerStore) => T,
): T => useStore(sleepTimerStore, selector);
