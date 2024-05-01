import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { playlists } from "@/db/schema";
import { favoriteKeys } from "@/api/favorites/_queryKeys";
import { playlistKeys } from "@/api/playlists/_queryKeys";

import { saveBase64Img, deleteFile } from "@/lib/file-system";

/*
  Saves the new cover image locally in the app's file system to make sure
  that it's present even if the user deletes the orginal image.
*/
async function updatePlaylistCover(playlistName: string) {
  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (result.canceled) throw new Error("Action cancelled.");

  const exists = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, playlistName),
  });
  if (!exists) throw new Error("Playlist doesn't exist.");

  const { base64, mimeType } = result.assets[0];
  if (!base64) throw new Error("No base64 representation found.");
  if (!mimeType) throw new Error("No mimeType found.");

  await deleteFile(exists.coverSrc);

  const newFileUri = await saveBase64Img(`data:${mimeType};base64,${base64}`);
  await db
    .update(playlists)
    .set({ coverSrc: newFileUri })
    .where(eq(playlists.name, playlistName));
}

/** @description Updates the cover of an existing playlist. */
export function useUpdatePlaylistCover(playlistName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => updatePlaylistCover(playlistName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
    },
  });
}
