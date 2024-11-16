import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { TrackWithAlbum } from "@/db/schema";
import { formatForTrack, sortTracks } from "@/db/utils";

import { addToPlaylist, favoriteTrack, removeFromPlaylist } from "@/api/track";
import { Resynchronize } from "@/modules/media/services/Music";
import { useSessionPreferencesStore } from "@/services/SessionPreferences";
import { queries as q } from "./keyStore";

import { pickKeys } from "@/utils/object";
import { ReservedPlaylists } from "@/modules/media/constants";

//#region Queries
/** Return the most-used subset of track data. */
export function useTrackExcerpt(trackId: string) {
  return useQuery({
    ...q.tracks.detail(trackId),
    select: (data) => ({
      ...pickKeys(data, ["id", "name", "artistName", "duration", "isFavorite"]),
      album: data.album ? pickKeys(data.album, ["id", "name"]) : null,
      imageSource: data.artwork,
    }),
  });
}

/** Return the names of the playlists this track is in. */
export function useTrackPlaylists(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.playlists });
}

/** Return list of `Track.Content` from tracks. */
export function useTracksForTrackCard() {
  const sortTracksFn = useSortTracksFn();
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
      // Invalidate all track queries, favorite tracks query, and all playlist queries.
      queryClient.invalidateQueries({ queryKey: q.tracks._def });
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
    mutationFn: (isFavorite: boolean) => favoriteTrack(trackId, isFavorite),
    onSuccess: () => {
      // Invalidate all track queries and the favorite tracks query.
      queryClient.invalidateQueries({ queryKey: q.tracks._def });
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
      // Invalidate all track queries, favorite tracks query, and all playlist queries.
      queryClient.invalidateQueries({ queryKey: q.tracks._def });
      queryClient.invalidateQueries({ queryKey: q.playlists._def });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
      // Ensure that if we're currently playing from the playlist we removed
      // the track from, we update it.
      Resynchronize.onTracks({ type: "playlist", id: playlistName });
    },
  });
}
//#endregion

//#region Internal Utils
/** Sorts tracks based on the session preference. */
function useSortTracksFn() {
  const isAsc = useSessionPreferencesStore((state) => state.isAsc);
  const orderedBy = useSessionPreferencesStore((state) => state.orderedBy);

  return useCallback(
    (data: TrackWithAlbum[]) => sortTracks(data, { isAsc, orderedBy }),
    [isAsc, orderedBy],
  );
}
//#endregion
