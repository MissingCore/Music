import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { playlists } from "~/db/schema";

import { Resynchronize } from "~/stores/Playback/actions";
import { createPlaylist, deletePlaylist, updatePlaylist } from "./api";
import { sanitizePlaylistName } from "./utils";
import { queries as q } from "../keyStore";

import { wait } from "~/utils/promise";

type InsertedPlaylist = Omit<typeof playlists.$inferInsert, "isFavorite"> & {
  tracks?: Array<{ id: string }>;
};

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
        description: track.artists?.join(", ") ?? "—",
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
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: Pick<InsertedPlaylist, "name" | "tracks">) =>
      createPlaylist(args),
    onSuccess: (_, { tracks }) => {
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      // Invalidate all track queries if we've added tracks.
      if (tracks) queryClient.invalidateQueries({ queryKey: q.tracks._def });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function useDeletePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlaylist(playlistName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

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

export function useUpdatePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: Partial<InsertedPlaylist>) =>
      updatePlaylist(playlistName, args),
    onSuccess: async (_, { name }) => {
      queryClient.resetQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.tracks._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      queryClient.invalidateQueries({ queryKey: ["search"] });

      // `sanitizePlaylistName` shouldn't throw an error.
      const sanitizedName = name ? sanitizePlaylistName(name) : undefined;

      if (sanitizedName) {
        await Resynchronize.onRename({
          oldSource: { type: "playlist", id: playlistName },
          newSource: { type: "playlist", id: sanitizedName },
        });
      }
    },
  });
}
//#endregion
