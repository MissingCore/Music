import { eq } from "drizzle-orm";

import { db } from "@/db";
import { playlists } from "@/db/schema";

import { generateFavoriteToggler } from "@/features/data/generateFavoriteToggler";
import { assortedDataKeys } from "@/features/data/queryKeys";
import { playlistKeys } from "./queryKeys";

async function toggleFavorite(playlistName: string, currState: boolean) {
  await db
    .update(playlists)
    .set({ isFavorite: !currState })
    .where(eq(playlists.name, playlistName));
}

/** @description Toggle the `isFavorite` state on a playlist. */
export const useToggleFavorite = generateFavoriteToggler(
  playlistKeys,
  toggleFavorite,
  [assortedDataKeys.favoriteLists],
);
