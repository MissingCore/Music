import type { tracks } from "~/db/schema";

import type { Prettify } from "~/utils/types";

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

export type BulkQueriedTrack = {
  id: string;
  name: string;
  rawArtistName: string | null;
  artwork: string | null;
  albumId: string | null;
  album: string | null;
  artists: string[] | null;
  uri: string;
  parentFolder: string | null;
};
