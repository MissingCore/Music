import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
/** Return a summary of what's stored in the database. */
export function useDatabaseSummary() {
  return useQuery({ ...q.settings.summary._ctx.database, staleTime: 0 });
}

/** Return a summary of the "user data" stored by the app. */
export function useStorageSummary() {
  return useQuery({ ...q.settings.summary._ctx.storage, staleTime: 0 });
}
//#endregion
