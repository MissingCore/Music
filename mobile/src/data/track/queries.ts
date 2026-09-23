// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import BackgroundTimer from "@boterop/react-native-background-timer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { Queue } from "~/stores/Playback/actions";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { deleteTracks, toggleTrackInPlaylist } from "./api";
import type { Track } from "./types";
import { queries as q } from "../keyStore";

import {
  clearAllQueries,
  queryClient as globalQueryClient,
} from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

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

const debouncedFavoritePlaylistInvalidation = (function () {
  let timeoutId: number | undefined;
  return function () {
    if (timeoutId !== undefined) BackgroundTimer.clearTimeout(timeoutId);
    timeoutId = BackgroundTimer.setTimeout(() => {
      globalQueryClient.invalidateQueries({
        queryKey: q.playlists.detail(FavoritesPlaylistKey).queryKey,
      });
    }, 150);
  };
})();

export function useToggleTrackInPlaylist(trackId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      toggleTrackInPlaylist({ trackId, playlistName }),
    onSuccess: (_, playlistName) => {
      queryClient.invalidateQueries({
        queryKey: q.tracks.detail(trackId).queryKey,
      });
      if (playlistName === FavoritesPlaylistKey) {
        //* Spam invalidating all playlist queries when spamming the "favorite"
        //* "Track Quick Action" will make things feel sluggish - debounce it
        //* to prevent unnecessary work.
        debouncedFavoritePlaylistInvalidation();
        //* Have a separate query for getting the number of favorite tracks,
        //* which is much less expensive when spam called.
        queryClient.invalidateQueries({
          queryKey: q.favorites.favoriteTracksCount.queryKey,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: q.playlists._def });
      }
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}
//#endregion
