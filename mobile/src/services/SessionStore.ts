import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;
}

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  volume: 1,
}));

export const useSessionStore = <T>(selector: (state: SessionStore) => T): T =>
  useStore(sessionStore, selector);
