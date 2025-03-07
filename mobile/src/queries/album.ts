import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatForCurrentScreen, formatForMediaCard } from "~/db/utils";

import { favoriteAlbum, updateAlbum } from "~/api/album";
import { Resynchronize } from "~/modules/media/services/Resynchronize";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { pickKeys } from "~/utils/object";
import { wait } from "~/utils/promise";

//#region Queries
/** Get specified album. */
export function useAlbum(albumId: string) {
  return useQuery({ ...q.albums.detail(albumId) });
}

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
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      await favoriteAlbum(albumId, isFavorite);
    },
    onSuccess: () => {
      // Invalidate all album queries and the favorite lists query.
      queryClient.invalidateQueries({ queryKey: q.albums._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Update specified album artwork. */
export function useUpdateAlbumArtwork(albumId: string) {
  return useMutation({
    mutationFn: ({ artwork }: { artwork?: string | null }) =>
      updateAlbum(albumId, { altArtwork: artwork }),
    onSuccess: () => {
      // Changing the album artwork affects a lot of things, so we'll just
      // clear all the queries.
      clearAllQueries();
      Resynchronize.onImage();
    },
  });
}
//#endregion
