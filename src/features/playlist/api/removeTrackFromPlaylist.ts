import { useMutation, useQueryClient } from "@tanstack/react-query";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { tracksToPlaylists } from "@/db/schema";
import { assortedDataKeys } from "@/features/data/queryKeys";
import { playlistKeys } from "./queryKeys";

async function removeTrackFromPlaylist(
  trackId: string,
  playlistName: string | undefined,
) {
  if (!playlistName) return;

  await db
    .delete(tracksToPlaylists)
    .where(
      and(
        eq(tracksToPlaylists.trackId, trackId),
        eq(tracksToPlaylists.playlistName, playlistName),
      ),
    );
}

/** @description Remove track from specified playlist. */
export function useRemoveTrackFromPlaylist(
  trackId: string,
  playlistName: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeTrackFromPlaylist(trackId, playlistName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({
        queryKey: assortedDataKeys.favoriteLists,
      });
      queryClient.invalidateQueries({
        queryKey: [{ entity: "is-track-in-playlist", trackId, playlistName }],
      });
    },
  });
}
