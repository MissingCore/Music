// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { MediaImageSrc } from "~/components/next/composed/media-image";

export type PlaylistSummary = {
  /** The raw `name` field stored in the `Playlists` schema. */
  id: string;
  /** Parsed `name` field to translate `FavoritesPlaylistKey`. */
  name: string;
  artwork: MediaImageSrc;
  duration: number;
  trackCount: number;
  isFavorite: boolean;
};

export type PlaylistSummaryTrack = {
  id: string;
  name: string;
  /** @deprecated */
  rawArtistName: string | null;
  albumName: string | null;
  uri: string;
};
