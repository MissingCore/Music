import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tracksToPlaylists } from "@/db/schema";

import { assortedDataKeys } from "@/features/data/queryKeys";
import { playlistKeys } from "./queryKeys";

type InPlaylistObj = Record<string, boolean>;

async function addTrackToPlaylists(trackId: string, inPlaylist: InPlaylistObj) {
  await db
    .delete(tracksToPlaylists)
    .where(eq(tracksToPlaylists.trackId, trackId));

  const newEntries = Object.entries(inPlaylist)
    .filter(([_name, status]) => status)
    .map(([name]) => ({ playlistName: name, trackId }));
  if (newEntries.length > 0) {
    await db.insert(tracksToPlaylists).values(newEntries);
  }
}

/** @description Have track be in the selected playlists. */
export function useAddTrackToPlaylists(trackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inPlaylist: InPlaylistObj) =>
      addTrackToPlaylists(trackId, inPlaylist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({
        queryKey: assortedDataKeys.favoriteLists,
      });
    },
  });
}
