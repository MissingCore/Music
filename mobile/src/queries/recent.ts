import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
/** Return a list of recently played media lists. */
export function useRecentlyPlayedMediaLists() {
  return useQuery({ ...q.recent.mediaLists, gcTime: 0, staleTime: 0 });
}

/** Return a list of recently played tracks. */
export function useRecentlyPlayedTracks() {
  return useQuery({ ...q.recent.tracks, gcTime: 0, staleTime: 0 });
}
//#endregion
