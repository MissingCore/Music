// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { updateAlbum } from "./api";
import { AlbumArtistsKey } from "./utils";
import { queries as q } from "../keyStore";

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
      const albumArtists = new Set(AlbumArtistsKey.deconstruct(artistsKey));
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
        tracks: tracks.map(({ name: title, duration, artists, ...other }) => {
          let description = formatSeconds(duration);
          if (Array.isArray(artists)) {
            const diff = artists.filter((name) => !albumArtists.has(name));
            if (diff.length > 0) description += ` • ${diff.join(", ")}`;
          }

          const { artwork: _, albumName: _1, ...rest } = other;
          return { ...rest, title, description, imageSource: null };
        }),

        artists: [...albumArtists],
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.albums.detail(albumId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}
//#endregion
