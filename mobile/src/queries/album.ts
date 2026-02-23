import { useMutation, useQueryClient } from "@tanstack/react-query";

import { favoriteAlbum } from "~/api/album";
import { queries as q } from "./keyStore";

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
//#endregion
