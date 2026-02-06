import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "~/db";
import type { TrackWithRelations } from "~/db/schema";
import { hiddenTracks } from "~/db/schema";

import {
  addToPlaylist,
  deleteTracks,
  removeFromPlaylist,
  updateTrack,
} from "~/api/track";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { Queue, Resynchronize } from "~/stores/Playback/actions";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

//#region Queries
/** Get specified track. */
export function useTrack(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId) });
}

/** Returns if the track is favorited. */
export function useTrackFavoriteStatus(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.isFavorite });
}

/** Return the names of the playlists this track is in. */
export function useTrackPlaylists(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.playlists });
}

export function useSortedTracks() {
  const trackIsAsc = useViewPreferenceStore((s) => s.trackIsAsc);
  const trackOrder = useViewPreferenceStore((s) => s.trackOrder);
  return useQuery({ ...q.tracks.sorted(trackOrder, trackIsAsc) });
}
//#endregion

//#region Mutations
/** Add track to playlist. */
export function useAddToPlaylist(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      addToPlaylist({ trackId, playlistName }),
    onSuccess: (_, playlistName) => {
      if (playlistName === FavoritesPlaylistKey) {
        queryClient.invalidateQueries({
          queryKey: q.tracks.detail(trackId)._ctx.isFavorite.queryKey,
        });
      }
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId)._ctx.playlists.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Hide a track. */
export function useHideTrack() {
  return useMutation({
    mutationFn: async ({ track }: { track: TrackWithRelations }) => {
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

/** Remove track from playlist. */
export function useRemoveFromPlaylist(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      removeFromPlaylist({ trackId, playlistName }),
    onSuccess: (_, playlistName) => {
      if (playlistName === FavoritesPlaylistKey) {
        queryClient.invalidateQueries({
          queryKey: q.tracks.detail(trackId)._ctx.isFavorite.queryKey,
        });
      }
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId)._ctx.playlists.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Update specified track artwork. */
export function useUpdateTrackArtwork(trackId: string) {
  return useMutation({
    mutationFn: ({ artwork }: { artwork?: string | null }) =>
      updateTrack(trackId, { altArtwork: artwork }),
    onSuccess: async () => {
      // Changing the track artwork affects a lot of things, so we'll just
      // clear all the queries.
      clearAllQueries();

      // Revalidate `activeTrack` in Playback store if needed.
      await Resynchronize.onActiveTrack({ type: "track", id: trackId });
    },
  });
}
//#endregion
