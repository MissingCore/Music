import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { playlists } from "~/db/schema";
import {
  getPlaylistCover,
  formatForCurrentScreen,
  formatForMediaCard,
  sanitizePlaylistName,
} from "~/db/utils";

import {
  createPlaylist,
  deletePlaylist,
  favoritePlaylist,
  moveInPlaylist,
  updatePlaylist,
} from "~/api/playlist";
import { Resynchronize } from "~/modules/media/services/Resynchronize";
import { queries as q } from "./keyStore";

import { useFocusedQuery } from "~/lib/react-query";
import { wait } from "~/utils/promise";

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
  return useFocusedQuery({
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
    mutationFn: (args: {
      playlistName: string;
      tracks?: Array<{ id: string }>;
    }) => createPlaylist({ name: args.playlistName, tracks: args.tracks }),
    onSuccess: (_, { tracks }) => {
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      // The `q.tracks.detail()._ctx.playlists` key needs to be updated for
      // each track added to this playlist on creation.
      if (tracks) {
        tracks.forEach(({ id }) =>
          queryClient.invalidateQueries({
            queryKey: q.tracks.detail(id)._ctx.playlists.queryKey,
          }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ["search"] });
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
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

/** Set the favorite status of an playlist. */
export function useFavoritePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the playlist. */
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      await favoritePlaylist(playlistName, isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.playlists.detail(playlistName).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Move a track in playlist. */
export function useMoveInPlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movement: { fromIndex: number; toIndex: number }) =>
      moveInPlaylist({ ...movement, playlistName }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.playlists.detail(playlistName).queryKey,
      });
      // Ensure that the order of the tracks in the playlist is correct.
      Resynchronize.onTracks({ type: "playlist", id: playlistName });
    },
  });
}

/** Update specified playlist. */
export function useUpdatePlaylist(playlistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updatedValues: Partial<
        Omit<typeof playlists.$inferInsert, "isFavorite">
      > & { tracks?: Array<{ id: string }> },
    ) => updatePlaylist(playlistName, updatedValues),
    onSuccess: async (_, { name, tracks }) => {
      queryClient.resetQueries({ queryKey: q.playlists._def });
      // Need to update all track queries as we don't exactly know which
      // were removed.
      queryClient.invalidateQueries({ queryKey: q.tracks._def });
      // Invalidate favorite lists query to update the artwork or name used.
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      queryClient.invalidateQueries({ queryKey: ["search"] });

      // Don't need a try-catch as `name` should be valid (as it's called
      // in `updatePlaylist()`).
      const sanitizedName = name ? sanitizePlaylistName(name) : undefined;

      if (sanitizedName) {
        await Resynchronize.onRename({
          oldSource: { type: "playlist", id: playlistName },
          newSource: { type: "playlist", id: sanitizedName },
        });
      }
      // Do this after checking for `sanitizedName` as the tracks will be
      // referenced on the new list name instead of `playlistName`.
      if (tracks !== undefined) {
        await Resynchronize.onTracks({
          type: "playlist",
          id: sanitizedName ?? playlistName,
        });
      }
    },
  });
}
//#endregion
