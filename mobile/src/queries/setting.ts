import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
/** Return a summary of what's stored in the database. */
export function useDatabaseSummary() {
  return useQuery({ ...q.settings.summary._ctx.database });
}

/** Returns latest stable & pre-release release notes from GitHub. */
export function useLatestRelease() {
  return useQuery({
    ...q.settings.releaseNote,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

/** Return the tracks that resulted in an error while saving. */
export function useSaveErrors() {
  return useQuery({ ...q.settings.saveErrors });
}

/** Return a summary of the "user data" stored by the app. */
export function useStorageSummary() {
  return useQuery({ ...q.settings.summary._ctx.storage });
}
//#endregion
