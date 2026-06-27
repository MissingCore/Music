// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { CommonTrack } from "../types";

export type AlbumTrack = CommonTrack & {
  disc: number | null;
  track: number | null;
};

export type AlbumSummary = {
  id: string;
  name: string;
  artistsKey: string;
  /** Used for auto-filling album information. */
  maxYear: number | null;
  /** Used for home screen sorting. */
  artistName: string;
  artwork: string | null;
  duration: number;
  trackCount: number;
};
