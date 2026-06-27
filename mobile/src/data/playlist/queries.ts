// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { updatePlaylist } from "./api";
import { queries as q } from "../keyStore";
import { getArtistsString } from "../artist/utils";

import { wait } from "~/utils/promise";

//#region Queries
export function usePlaylist(playlistName: string) {
  return useQuery({ ...q.playlists.detail(playlistName) });
}

export function usePlaylistForScreen(playlistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.playlists.detail(playlistName),
    select: ({ name, artwork, isFavorite, tracks, duration }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.playlist"),
        t("plural.track", { count: tracks.length }),
        duration,
      ],
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: getArtistsString(track.artists),
        imageSource: track.artwork,
      })),

      isFavorite,
    }),
  });
}

export function usePlaylists() {
  return useQuery({ ...q.playlists.all });
}

export function usePlaylistsNames() {
  return useQuery({
    ...q.playlists.all,
    select: (data) => data.map((p) => p.name),
  });
}
//#endregion

//#region Mutations
export function useFavoritePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      return updatePlaylist(playlistName, { isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.playlists.detail(playlistName).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}
//#endregion
