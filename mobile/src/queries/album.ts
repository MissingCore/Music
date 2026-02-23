import { useMutation, useQueryClient } from "@tanstack/react-query";

import { favoriteAlbum, updateAlbum } from "~/api/album";
import { Resynchronize } from "~/stores/Playback/actions";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";

//#region Mutations
/** Set the favorite status of an album. */
export function useFavoriteAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the album. */
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      await favoriteAlbum(albumId, isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.albums.detail(albumId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Update specified album artwork. */
export function useUpdateAlbumArtwork(albumId: string) {
  return useMutation({
    mutationFn: ({ artwork }: { artwork?: string | null }) =>
      updateAlbum(albumId, { altArtwork: artwork }),
    onSuccess: async () => {
      // Changing the album artwork affects a lot of things, so we'll just
      // clear all the queries.
      clearAllQueries();

      // Revalidate `activeTrack` in Playback store if needed.
      await Resynchronize.onActiveTrack({ type: "album", id: albumId });
    },
  });
}
//#endregion
