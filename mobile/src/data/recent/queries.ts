import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";

//#region Queries
export function useRecentlyPlayedMedia() {
  return useQuery({ ...q.recent.all, gcTime: 0, staleTime: 0 });
}
//#endregion
