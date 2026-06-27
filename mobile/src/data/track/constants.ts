// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import {
  tracksToArtists,
  tracksToGenres,
  tracksToLyrics,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

export const TrackRelationTables = [
  tracksToArtists,
  tracksToGenres,
  tracksToLyrics,
  tracksToPlaylists,
  waveformSamples,
];
