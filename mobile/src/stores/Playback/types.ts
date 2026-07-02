// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/** Types of "media" we can play audio from. */
export type MediaType =
  "album" | "artist" | "folder" | "genre" | "playlist" | "track";

/** Identifies a list of tracks that will be played. */
export type PlayFromSource = { type: Exclude<MediaType, "track">; id: string };
