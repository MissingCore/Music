import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface SessionPreferencesStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;
}

export const sessionPreferencesStore = createStore<SessionPreferencesStore>()(
  () => ({
    playbackSpeed: 1,
    volume: 1,
  }),
);

export const useSessionPreferencesStore = <T>(
  selector: (state: SessionPreferencesStore) => T,
): T => useStore(sessionPreferencesStore, selector);
