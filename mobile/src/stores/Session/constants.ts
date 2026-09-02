// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { Artist, WaveformSample } from "~/db/schema";

import type { Track } from "~/data/track/types";

import type { PopStrategy } from "./types";

//#region Store
export interface SessionStore {
  /** Time since epoch where we started recording play events. */
  recapStartEpoch: number;
  /** Time range we'll display by default on the "Recap" screen. */
  defaultRecapRange: {
    rangeLabel: string;
    startEpoch: number;
    endEpoch: number;
  };

  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** The factor at which the pitch will be shifted (from 0.25 to 2). */
  playbackPitch: number;

  /** Track displayed in global track sheet. */
  displayedTrack: Track | null;
  /** Artists displayed in global artist sheet. */
  displayedArtists: { artists: Artist[]; popStrategy?: PopStrategy } | null;

  /** Waveform data for the active track. */
  activeWaveformContext: WaveformSample | null;

  // Type of content shown on the "Albums" screen.
  showSingles: boolean;
  showEPs: boolean;
  showAlbums: boolean;
}
//#endregion
