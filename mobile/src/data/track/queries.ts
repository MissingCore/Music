import { useMutation } from "@tanstack/react-query";

import { Resynchronize } from "~/stores/Playback/actions";
import { updateTrack } from "./api";

import { clearAllQueries } from "~/lib/react-query";

//#region Mutations
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
