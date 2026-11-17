// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type Media =
  "album" | "artist" | "folder" | "genre" | "playlist" | "track";

export type PlayFromSource = { type: Exclude<Media, "track">; id: string };

/** Names of playlists a user can't create. */
export const ReservedNames = {
  tracks: "Tracks",
} as const;
