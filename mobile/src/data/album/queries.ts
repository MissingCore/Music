import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Resynchronize } from "~/stores/Playback/actions";
import { queries as q } from "~/queries/keyStore";
import { updateAlbum } from "./api";
import { AlbumArtistsKey } from "./utils";

import { clearAllQueries } from "~/lib/react-query";
import { formatSeconds } from "~/utils/number";
import { wait } from "~/utils/promise";

//#region Queries
export function useAlbum(albumId: string) {
  return useQuery({ ...q.albums.detail(albumId) });
}

export function useAlbumForScreen(albumId: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.albums.detail(albumId),
    select: ({ name, artistsKey, artwork, isFavorite, tracks, year }) => {
      const albumArtists = AlbumArtistsKey.deconstruct(artistsKey);

      return {
        name,
        imageSource: artwork,
        metadata: [
          t("term.album"),
          ...(year ? [year] : []),
          t("plural.track", { count: tracks.length }),
          formatSeconds(
            tracks.reduce((total, curr) => total + curr.duration, 0),
          ),
        ],
        tracks: tracks.map(({ name: title, duration, artists, ...rest }) => {
          let description = formatSeconds(duration);
          if (Array.isArray(artists)) {
            const diff = artists.filter((name) => !albumArtists.includes(name));
            if (diff.length > 0) description += ` • ${diff.join(", ")}`;
          }

          return { ...rest, title, description, imageSource: null };
        }),

        artists: albumArtists,
        isFavorite,
      };
    },
  });
}

export function useAlbums() {
  return useQuery({ ...q.albums.all });
}
//#endregion

//#region Mutations
export function useFavoriteAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      return updateAlbum(albumId, { isFavorite });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: q.albums.detail(albumId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

export function useUpdateAlbum(albumId: string) {
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
