import { useMutation, useQuery } from "@tanstack/react-query";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { deleteTracks } from "~/data/track/api";
import type { Track } from "~/data/track/types";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { Queue } from "~/stores/Playback/actions";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";

//#region Queries
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
//#endregion
