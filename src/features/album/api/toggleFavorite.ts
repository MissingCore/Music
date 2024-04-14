import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import type { Album } from "@/db/schema";
import { albums } from "@/db/schema";

import { albumKeys } from "./queryKeys";

async function toggleFavorite(albumId: string, currState: boolean) {
  await db
    .update(albums)
    .set({ isFavorite: !currState })
    .where(eq(albums.id, albumId));
}

/** @description Toggle the `isFavorite` state on an album. */
export const useToggleFavorite = (albumId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currState: boolean) => toggleFavorite(albumId, currState),
    onSuccess: () => {
      // Update the specific album entry.
      queryClient.setQueryData(
        albumKeys.detail(albumId),
        (old: Partial<Album>) => ({ ...old, isFavorite: !old.isFavorite }),
      );
      // Update the album entry in the cumulative list.
      queryClient.setQueryData(albumKeys.all, (old: Partial<Album>[]) =>
        old.map((al) => {
          if (al.id !== albumId) return al;
          return { ...al, isFavorite: !al.isFavorite };
        }),
      );
    },
  });
};
