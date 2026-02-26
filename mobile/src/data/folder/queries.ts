import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";

//#region Queries
export function useFolderContent(folderPath?: string) {
  return useQuery({
    ...q.folders.detail(folderPath),
    select: ({ directories, tracks }) => ({
      directories,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.artists?.join(", ") ?? "—",
        imageSource: track.artwork,
      })),
    }),
  });
}
//#endregion
