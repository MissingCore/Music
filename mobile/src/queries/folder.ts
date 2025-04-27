import { useQuery } from "@tanstack/react-query";

import { formatForTrack } from "~/db/utils";

import { queries as q } from "./keyStore";

//#region Queries
/** Return the subdirectories and tracks in this current directory. */
export function useFolderContent(folderPath?: string) {
  return useQuery({
    ...q.folders.detail(folderPath),
    staleTime: 1000 * 60 * 5, // 5 Minutes
    select: ({ subDirectories, tracks }) => ({
      subDirectories,
      tracks: tracks.map((track) => formatForTrack("track", track)),
    }),
  });
}
//#endregion
