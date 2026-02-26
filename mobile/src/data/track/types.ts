import type { tracks } from "~/db/schema";

import type { Prettify } from "~/utils/types";
import type { CommonTrack } from "../types";

type TRACK_INTERNAL = Omit<
  typeof tracks.$inferSelect,
  "rawArtistName" | "isFavorite" | "hiddenAt"
>;

export type Track = Prettify<
  TRACK_INTERNAL & {
    album: string | null;
    albumArtistsKey: string | null;
    artists: string[] | null;
  }
>;

export type SortedTrack = {
  id: string;
  name: string;
  /** Used for home screen sorting. */
  artistName: string | null;
  albumName: string | null;
  duration: number;
  discoverTime: number;
  modificationTime: number;
  artwork: string | null;
};

export type BulkQueriedTrack = CommonTrack & {
  rawArtistName: string | null;
  albumId: string | null;
  album: string | null;
  uri: string;
  parentFolder: string | null;
};
