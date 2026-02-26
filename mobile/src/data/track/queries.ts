import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { Queue, Resynchronize } from "~/stores/Playback/actions";
import { queries as q } from "~/queries/keyStore";
import { deleteTracks, toggleTrackInPlaylist, updateTrack } from "./api";
import type { Track } from "./types";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";

//#region Queries
export function useTrack(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId) });
}

//#region Relation Queries
export function useTrackFavoriteStatus(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.isFavorite });
}

export function useTrackGenres(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.genres });
}

export function useTrackPlaylists(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.playlists });
}

export function usePlaylists() {
  return useQuery({ ...q.playlists.all });
}
//#endregion
//#endregion

//#region Mutations
export function useHideTrack() {
  return useMutation({
    mutationFn: async ({ track }: { track: Track }) => {
      const { id, uri, name } = track;
      await wait(1);
      await db
        .insert(hiddenTracks)
        .values({ id, uri, name, hiddenAt: Date.now() });
      await deleteTracks([{ id }]);
    },
    onSuccess: async (_, { track }) => {
      // There's a lot of places where this track may appear.
      clearAllQueries();
      await Queue.removeIds([track.id]);
    },
  });
}

export function useToggleTrackInPlaylist(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      toggleTrackInPlaylist({ trackId, playlistName }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

export function useUpdateTrack(trackId: string) {
  return useMutation({
    mutationFn: ({ artwork }: { artwork?: string | null }) =>
      updateTrack(trackId, { altArtwork: artwork }),
    onSuccess: async () => {
      // Changing the album artwork affects a lot of things, so we'll just
      // clear all the queries.
      clearAllQueries();

      // Revalidate `activeTrack` in Playback store if needed.
      await Resynchronize.onActiveTrack({ type: "track", id: trackId });
    },
  });
}
//#endregion
