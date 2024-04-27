import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { router } from "expo-router";

import { db } from "@/db";
import { playlists, tracksToPlaylists } from "@/db/schema";

import { deleteFile } from "@/lib/file-system";
import { assortedDataKeys } from "@/features/data/queryKeys";
import { playlistKeys } from "./queryKeys";

async function deletePlaylist(playlistName: string) {
  await db
    .delete(tracksToPlaylists)
    .where(eq(tracksToPlaylists.playlistName, playlistName));
  const [deletedPlaylist] = await db
    .delete(playlists)
    .where(eq(playlists.name, playlistName))
    .returning({ coverSrc: playlists.coverSrc });

  await deleteFile(deletedPlaylist.coverSrc);
}

/** @description Delete a given playlist. */
export function useDeletePlaylist(playlistName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePlaylist(playlistName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({
        queryKey: assortedDataKeys.favoriteLists,
      });
      router.back();
    },
  });
}
