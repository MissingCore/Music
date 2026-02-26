import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";
import { getArtistsString } from "../artist/utils";

//#region Queries
export function useFolderContent(folderPath?: string) {
  return useQuery({
    ...q.folders.detail(folderPath),
    select: ({ directories, tracks }) => ({
      directories,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: getArtistsString(track.artists),
        imageSource: track.artwork,
      })),
    }),
  });
}
//#endregion
