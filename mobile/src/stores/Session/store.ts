import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { SessionStore } from "./constants";

export const sessionStore = createStore<SessionStore>()(() => ({
  playbackSpeed: 1,
  playbackPitch: 1,

  displayedTrack: null,
  displayedArtists: null,

  activeWaveformContext: null,
}));

export function useSessionStore<T>(selector: (state: SessionStore) => T): T {
  return useStore(sessionStore, selector);
}
