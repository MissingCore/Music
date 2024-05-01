import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { playlists, tracksToPlaylists } from "@/db/schema";
import { favoriteKeys } from "@/api/favorites/_queryKeys";
import { playlistKeys } from "@/api/playlists/_queryKeys";

import { ReservedNames } from "@/features/playback/utils/trackList";

async function updatePlaylistName(oldName: string, newName: string) {
  const sanitizedName = newName.trim();
  if (sanitizedName.length === 0 || sanitizedName.length > 30) {
    throw new Error("Playlist name must be between 1-30 character.");
  }

  if (ReservedNames.has(sanitizedName)) {
    throw new Error("That playlist name is reserved.");
  }

  const exists = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, newName),
  });
  if (exists) throw new Error("Playlist with that name already exists.");

  await db
    .update(playlists)
    .set({ name: sanitizedName })
    .where(eq(playlists.name, oldName));
  await db
    .update(tracksToPlaylists)
    .set({ playlistName: sanitizedName })
    .where(eq(tracksToPlaylists.playlistName, oldName));

  return sanitizedName;
}

/** @description Updates the name of an existing playlist. */
export function useUpdatePlaylistName(oldName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newName: string) => updatePlaylistName(oldName, newName),
    onSuccess: (newName: string) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      router.replace(`/playlist/${newName}`);
    },
  });
}
