// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { SessionStore } from "./constants";

export const sessionStore = createStore<SessionStore>()(() => ({
  recapStartEpoch: 0,
  defaultRecapRange: { rangeLabel: "", startEpoch: 0, endEpoch: 0 },

  playbackSpeed: 1,
  playbackPitch: 1,

  displayedTrack: null,
  displayedArtists: null,

  activeWaveformContext: null,

  showSingles: true,
  showEPs: true,
  showAlbums: true,
}));

export function useSessionStore<T>(selector: (state: SessionStore) => T): T {
  return useStore(sessionStore, selector);
}
