import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import type { playlists } from "@/db/schema";
import {
  getPlaylistCover,
  formatForCurrentScreen,
  formatForMediaCard,
  sanitizePlaylistName,
} from "@/db/utils";

import {
  createPlaylist,
  deletePlaylist,
  favoritePlaylist,
  updatePlaylist,
} from "@/api/playlist";
import { Resynchronize } from "@/modules/media/services/Resynchronize";
import { queries as q } from "./keyStore";

//#region Queries
/** Get specified playlist. */
export function usePlaylist(playlistName: string) {
  return useQuery({
    ...q.playlists.detail(playlistName),
    select: (data) => ({ ...data, imageSource: getPlaylistCover(data) }),
  });
}

/** Format playlist information for playlist's `(current)` screen. */
export function usePlaylistForScreen(playlistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.playlists.detail(playlistName),
    select: (data) => ({
      ...formatForCurrentScreen({ type: "playlist", data, t }),
      isFavorite: data.isFavorite,
    }),
  });
}

/** Get all playlists. */
export function usePlaylists() {
  return useQuery({ ...q.playlists.all });
}

/** Return list of `MediaCard.Content` from playlists. */
export function usePlaylistsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...q.playlists.all,
    select: (data) =>
      data.map((playlist) =>
        formatForMediaCard({ type: "playlist", data: playlist, t }),
      ),
  });
}
//#endregion

//#region Mutations
/** Create a new playlist. */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      createPlaylist({ name: playlistName }),
    onSuccess: () => {
      // Invalidate all playlist queries.
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
    },
  });
}

/** Delete specified playlist. */
export function useDeletePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlaylist(playlistName),
    onSuccess: () => {
      Resynchronize.onDelete({ type: "playlist", id: playlistName });
      // Invalidate all playlist queries and the favorite lists query.
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      // Go back a page as this current page (deleted playlist) isn't valid.
      router.back();
    },
  });
}

/** Set the favorite status of an playlist. */
export function useFavoritePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the playlist. */
    mutationFn: (isFavorite: boolean) =>
      favoritePlaylist(playlistName, isFavorite),
    onSuccess: () => {
      // Invalidate all playlist queries and the favorite lists query.
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Update specified playlist. */
export function useUpdatePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updatedValues: Partial<Omit<typeof playlists.$inferInsert, "isFavorite">>,
    ) => updatePlaylist(playlistName, updatedValues),
    onSuccess: (_, { name, artwork }) => {
      // Invalidate all playlist queries.
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      // Invalidate favorite lists query to update the artwork or name used.
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });

      if (artwork !== undefined) Resynchronize.onImage();
      if (name) {
        const sanitizedName = sanitizePlaylistName(name);
        Resynchronize.onRename({
          oldSource: { type: "playlist", id: playlistName },
          newSource: { type: "playlist", id: sanitizedName },
        });
        // Redirect to new playlist page if we renamed.
        router.replace(`/playlist/${encodeURIComponent(sanitizedName)}`);
      }
    },
  });
}
//#endregion
