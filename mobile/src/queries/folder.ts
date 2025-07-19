import { formatForTrack } from "~/db/utils";

import { queries as q } from "./keyStore";

import { useFocusedQuery } from "~/lib/react-query";

//#region Queries
/** Return the subdirectories and tracks in this current directory. */
export function useFolderContent(folderPath?: string) {
  return useFocusedQuery({
    ...q.folders.detail(folderPath),
    select: ({ subDirectories, tracks }) => ({
      subDirectories,
      tracks: tracks.map((track) => formatForTrack("track", track)),
    }),
  });
}
//#endregion
