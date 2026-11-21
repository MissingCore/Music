// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type MediaList = "album" | "artist" | "folder" | "genre" | "playlist";
export type Media = MediaList | "track";

export type PlayFromSource = { type: MediaList; id: string };

/** Names of playlists a user can't create. */
export const ReservedNames = {
  tracks: "Tracks",
} as const;
