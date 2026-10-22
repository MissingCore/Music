// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/** Screens available on initial launch. */
export type RootTab = "home" | "library";

/** Screens available on the "Library" screen. */
export type LibraryTab =
  "album" | "artist" | "folder" | "genre" | "playlist" | "track";

/** Tabs available on the Home screen. */
export type Tab = LibraryTab | "home";
