// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { tracks } from "~/db/schema";

import type { Prettify } from "~/utils/types";
import type { CommonTrack } from "../types";

type TRACK_INTERNAL = Omit<
  typeof tracks.$inferSelect,
  "rawArtistName" | "isFavorite" | "hiddenAt"
>;

export type Track = Prettify<
  TRACK_INTERNAL & {
    albumName: string | null;
    albumArtistsKey: string | null;
    artists: string[] | null;
  }
>;

export type SortedTrack = CommonTrack & {
  /** Used for home screen sorting. */
  artistName: string | null;
  discoverTime: number;
  modificationTime: number;
};

export type BulkQueriedTrack = CommonTrack & {
  /** @deprecated */
  rawArtistName: string | null;
  albumId: string | null;
  parentFolder: string | null;
};
