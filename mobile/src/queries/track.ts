import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { TrackWithAlbum } from "@/db/schema";
import { formatForTrack } from "@/db/utils";

import {
  addToPlaylist,
  favoriteTrack,
  removeFromPlaylist,
} from "@/api/new/track";
import { Resynchronize } from "@/modules/media/services/Music";
import { useSessionPreferencesStore } from "@/services/SessionPreferences";
import { queries as q } from "./keyStore";

import { pickKeys } from "@/utils/object";
import { ReservedPlaylists } from "@/modules/media/constants";

//#region Queries
/** Return list of `Track.Content` from tracks. */
export function useTracksForTrackCard() {
  const sortTracks = useSortTracksFn();
  return useQuery({
    ...q.tracks.all,
    select: (data) =>
      sortTracks(data).map((track) => formatForTrack("track", track)),
  });
}

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
//#endregion

//#region Mutations
/** Toggle the favorite status of an track by passing the current status. */
export function useFavoriteTrack(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the current favorite status of the track. */
    mutationFn: (isFavorite: boolean) => favoriteTrack(trackId, !isFavorite),
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
    (data: TrackWithAlbum[]) => {
      // FIXME: Once Hermes supports `toSorted` & `toReversed`, use those
      // instead of the in-place methods.
      let sortedTracks: TrackWithAlbum[] = [...data];
      // Order track by attribute.
      if (orderedBy === "alphabetical") {
        sortedTracks.sort((a, b) => a.name.localeCompare(b.name));
      } else if (orderedBy === "modified") {
        sortedTracks.sort((a, b) => a.modificationTime - b.modificationTime);
      }
      // Sort tracks in descending order.
      if (!isAsc) sortedTracks.reverse();

      return sortedTracks;
    },
    [isAsc, orderedBy],
  );
}
//#endregion
