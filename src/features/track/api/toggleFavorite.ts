import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tracks } from "@/db/schema";

import { generateFavoriteToggler } from "@/features/data/generateFavoriteToggler";
import { assortedDataKeys } from "@/features/data/queryKeys";
import { trackKeys } from "./queryKeys";

async function toggleFavorite(trackId: string, currState: boolean) {
  await db
    .update(tracks)
    .set({ isFavorite: !currState })
    .where(eq(tracks.id, trackId));
}

/** @description Toggle the `isFavorite` state on a track. */
export const useToggleFavorite = generateFavoriteToggler(
  trackKeys,
  toggleFavorite,
  [assortedDataKeys.favoriteTracks],
);
