import { useMutation, useQuery } from "@tanstack/react-query";

import { db } from "~/db";
import type { TrackWithRelations } from "~/db/schema";
import { hiddenTracks } from "~/db/schema";

import { deleteTracks } from "~/api/track";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { Queue } from "~/stores/Playback/actions";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";

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

/** Return the names of the genres the track has. */
export function useTrackGenres(trackId: string) {
  return useQuery({ ...q.tracks.detail(trackId)._ctx.genres });
}

export function useSortedTracks(isReady = true) {
  const trackIsAsc = useViewPreferenceStore((s) => s.trackIsAsc);
  const trackOrder = useViewPreferenceStore((s) => s.trackOrder);
  return useQuery({
    ...q.tracks.sorted(trackOrder, trackIsAsc),
    enabled: isReady,
  });
}
//#endregion

//#region Mutations
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
//#endregion
