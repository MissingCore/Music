import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatForCurrentScreen, formatForMediaCard } from "@/db/utils";

import { favoriteAlbum } from "@/api/album";
import { queries as q } from "./keyStore";

import { pickKeys } from "@/utils/object";

//#region Queries
/** Format album information for album's `(current)` screen. */
export function useAlbumForScreen(albumId: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.albums.detail(albumId),
    select: (data) => ({
      ...formatForCurrentScreen({ type: "album", data, t }),
      ...pickKeys(data, ["artistName", "isFavorite"]),
    }),
  });
}

/** Return list of `MediaCard.Content` from albums. */
export function useAlbumsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...q.albums.all,
    select: (data) =>
      data.map((album) =>
        formatForMediaCard({ type: "album", data: album, t }),
      ),
  });
}
//#endregion

//#region Mutations
/** Set the favorite status of an album. */
export function useFavoriteAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the album. */
    mutationFn: (isFavorite: boolean) => favoriteAlbum(albumId, isFavorite),
    onSuccess: () => {
      // Invalidate all album queries and the favorite lists query.
      queryClient.invalidateQueries({ queryKey: q.albums._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}
//#endregion
