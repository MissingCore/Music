import type { tracks } from "~/db/schema";

import type { Prettify } from "~/utils/types";

type TRACK_INTERNAL = Omit<
  typeof tracks.$inferSelect,
  "rawArtistName" | "isFavorite" | "hiddenAt"
>;

export type Track = Prettify<
  TRACK_INTERNAL & {
    album: string | null;
    artists: string[] | null;
  }
>;
