import BackgroundTimer from "@boterop/react-native-background-timer";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { MusicControls } from "~/modules/media/services/Playback";

interface SleepTimerStore {
  /** Reference to current active timer. */
  ref: ReturnType<typeof BackgroundTimer.setTimeout> | null;

  /** Duration of timer in minutes. */
  duration: number;
  /** Epoch time where this timer will end. */
  endAt: number | null;

  /** Create a sleep timer. */
  create: (minutes: number) => void;
  /** Clear the current sleep timer. */
  clear: VoidFunction;
}

export const sleepTimerStore = createStore<SleepTimerStore>()((set, get) => ({
  ref: null,
  duration: 5,

  endAt: null,

  create: (minutes) => {
    const { clear: clearSleepTimer } = get();
    clearSleepTimer();

    const durationMS = minutes * 60 * 1000;
    const timerRef = BackgroundTimer.setTimeout(() => {
      MusicControls.stop();
      clearSleepTimer();
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
