import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatForCurrentScreen, formatForMediaCard } from "@/db/utils";

import { favoriteAlbum } from "@/api/new/album";
import { queries } from "./keyStore";

import { pickKeys } from "@/utils/object";

//#region Queries
/** Return list of `MediaCard.Content` from albums. */
export function useAlbumsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...queries.albums.all,
    select: (data) =>
      data.map((album) =>
        formatForMediaCard({ type: "album", data: album, t }),
      ),
  });
}

/** Format album information for album's `(current)` screen. */
export function useAlbumForCurrentPage(albumId: string) {
  const { t } = useTranslation();
  return useQuery({
    ...queries.albums.detail(albumId),
    select: (data) => ({
      ...formatForCurrentScreen({ type: "album", data, t }),
      ...pickKeys(data, ["artistName", "isFavorite"]),
      imageSource: data.artwork,
    }),
  });
}
//#endregion

//#region Mutations
/** Toggle the favorite status of an album by passing the current status. */
export function useFavoriteAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the current favorite status of the album. */
    mutationFn: (isFavorite: boolean) => favoriteAlbum(albumId, !isFavorite),
    onSuccess: () => {
      // Invalidate all album queries and the favorite lists query.
      queryClient.invalidateQueries({ queryKey: queries.albums._def });
      queryClient.invalidateQueries({
        queryKey: queries.favorites.lists.queryKey,
      });
    },
  });
}
//#endregion
