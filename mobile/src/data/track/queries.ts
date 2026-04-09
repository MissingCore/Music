import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { Queue } from "~/stores/Playback/actions";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { deleteTracks, toggleTrackInPlaylist } from "./api";
import type { Track } from "./types";
import { queries as q } from "../keyStore";

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
//#endregion

export function useSortedTracks(isReady = true) {
  const isAsc = useViewPreferenceStore((s) => s.trackIsAsc);
  const order = useViewPreferenceStore((s) => s.trackOrder);
  return useQuery({
    ...q.tracks.sorted({ isAsc, order }),
    enabled: isReady,
  });
}
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
//#endregion
