import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
/** Return a summary of what's stored in the database. */
export function useDatabaseSummary() {
  return useQuery({ ...q.settings.summary._ctx.database, staleTime: 0 });
}

/** Returns latest stable & pre-release release notes from GitHub. */
export function useLatestRelease() {
  return useQuery({
    ...q.settings.releaseNote,
    gcTime: Infinity,
    retry: false,
  });
}

/** Return tracks that we've hidden. */
export function useHiddenTracks() {
  return useQuery({
    ...q.settings.hiddenTracks,
    select: (data) => {
      // FIXME: Once Hermes supports `toSorted`, use it instead.
      data.sort((a, b) => {
        // Both `hiddenAt` should technically be not `null`.
        if (a.hiddenAt === b.hiddenAt) return 0;
        if (a.hiddenAt === null) return 1;
        if (b.hiddenAt === null) return -1;
        return b.hiddenAt - a.hiddenAt;
      });
      return data;
    },
    staleTime: 0,
  });
}

/** Return the tracks that resulted in an error while saving. */
export function useSaveErrors() {
  return useQuery({ ...q.settings.saveErrors, staleTime: 0 });
}

/** Return a summary of the "user data" stored by the app. */
export function useStorageSummary() {
  return useQuery({ ...q.settings.summary._ctx.storage, staleTime: 0 });
}
//#endregion
