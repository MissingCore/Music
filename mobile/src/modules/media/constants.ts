// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export const FavoritesPlaylistKey = "favorites";

/** Names of playlists a user can't create. */
export const ReservedPlaylists = {
  tracks: "Tracks",
  // Special utility route names.
  create: "create",
  modify: "modify",
} as const;

export type ReservedPlaylistName =
  (typeof ReservedPlaylists)[keyof typeof ReservedPlaylists];

/** A set of strings that we shouldn't allow to be used. */
export const ReservedNames = new Set<string>(Object.values(ReservedPlaylists));
