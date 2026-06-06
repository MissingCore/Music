import type { Artist, WaveformSample } from "~/db/schema";

import type { Track } from "~/data/track/types";

import type { PopStrategy } from "./types";

//#region Store
export interface SessionStore {
  /** The rate at which the media is played (from 0.25 to 2). */
  playbackSpeed: number;
  /** The factor at which the pitch will be shifted (from 0.25 to 2). */
  playbackPitch: number;
  /** Percentage of device volume audio will be outputted with. */
  volume: number;

  /** Track displayed in global track sheet. */
  displayedTrack: Track | null;
  /** Artists displayed in global artist sheet. */
  displayedArtists: { artists: Artist[]; popStrategy?: PopStrategy } | null;

  /** Waveform data for the active track. */
  activeWaveformContext: WaveformSample | null;
}
//#endregion
