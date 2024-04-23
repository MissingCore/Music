import { eq } from "drizzle-orm";

import { db } from "@/db";
import { albums } from "@/db/schema";

import { generateFavoriteToggler } from "@/features/data/generateFavoriteToggler";
import { albumKeys } from "./queryKeys";

async function toggleFavorite(albumId: string, currState: boolean) {
  await db
    .update(albums)
    .set({ isFavorite: !currState })
    .where(eq(albums.id, albumId));
}

/** @description Toggle the `isFavorite` state on an album. */
export const useToggleFavorite = generateFavoriteToggler(
  albumKeys,
  toggleFavorite,
);
