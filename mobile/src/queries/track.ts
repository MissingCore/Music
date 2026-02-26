import { useQuery } from "@tanstack/react-query";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { queries as q } from "./keyStore";

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
