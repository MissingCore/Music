import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Resynchronize } from "~/stores/Playback/actions";
import { queries as q } from "~/queries/keyStore";
import { toggleTrackInPlaylist, updateTrack } from "./api";

import { clearAllQueries } from "~/lib/react-query";

//#region Mutations
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
