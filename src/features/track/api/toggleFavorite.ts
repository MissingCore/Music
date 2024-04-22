import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import type { Track } from "@/db/schema";
import { tracks } from "@/db/schema";

import { trackKeys } from "./queryKeys";

async function toggleFavorite(trackId: string, currState: boolean) {
  await db
    .update(tracks)
    .set({ isFavorite: !currState })
    .where(eq(tracks.id, trackId));
}

/** @description Toggle the `isFavorite` state on a track. */
export const useToggleFavorite = (trackId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currState: boolean) => toggleFavorite(trackId, currState),
    onSuccess: () => {
      // Update the specific track entry.
      queryClient.setQueryData(
        trackKeys.detail(trackId),
        (old: Partial<Track>) => ({ ...old, isFavorite: !old.isFavorite }),
      );
      // Update the track entry in the cumulative list.
      queryClient.setQueryData(trackKeys.all, (old: Partial<Track>[]) =>
        old.map((tk) => {
          if (tk.id !== trackId) return tk;
          return { ...tk, isFavorite: !tk.isFavorite };
        }),
      );
    },
  });
};
