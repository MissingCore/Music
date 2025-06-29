import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { formatForTrack } from "~/db/utils";

import {
  addToPlaylist,
  favoriteTrack,
  removeFromPlaylist,
  updateTrack,
} from "~/api/track";
import { revalidateActiveTrack } from "~/modules/media/helpers/revalidate";
import { Resynchronize } from "~/modules/media/services/Resynchronize";
import { useSortTracks } from "~/modules/media/services/SortPreferences";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { ReservedPlaylists } from "~/modules/media/constants";

//#region Queries
/** Get specified track. */
export function useTrack(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId) });
}

/** Return the names of the playlists this track is in. */
export function useTrackPlaylists(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.playlists });
}

/** Return list of `Track.Content` from tracks. */
export function useTracksForTrackCard() {
  const sortTracksFn = useSortTracks();
  return useQuery({
    ...q.tracks.all,
    select: (data) =>
      sortTracksFn(data).map((track) => formatForTrack("track", track)),
  });
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
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId)._ctx.playlists.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      // Ensure that if we're currently playing from the playlist we added
      // the track to, we update it.
      Resynchronize.onTracks({ type: "playlist", id: playlistName });
    },
  });
}

/** Set the favorite status of an track. */
export function useFavoriteTrack(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the track. */
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      await favoriteTrack(trackId, isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.tracks.queryKey });
      Resynchronize.onTracks({
        type: "playlist",
        id: ReservedPlaylists.favorites,
      });
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
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId)._ctx.playlists.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      // Ensure that if we're currently playing from the playlist we removed
      // the track from, we update it.
      Resynchronize.onTracks({ type: "playlist", id: playlistName });
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

      // Revalidate `activeTrack` in Music store if needed.
      await revalidateActiveTrack({ type: "track", id: trackId });
    },
  });
}
//#endregion
