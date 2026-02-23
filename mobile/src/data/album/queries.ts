import { useQuery } from "@tanstack/react-query";

import { queries as q } from "~/queries/keyStore";

//#region Queries
export function useAlbums() {
  return useQuery({ ...q.albums.all });
}
//#endregion
