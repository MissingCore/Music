import { useQuery } from "@tanstack/react-query";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { queries as q } from "../keyStore";

//#region Queries
export function useFolderContent(folderPath?: string) {
  const folderIsAsc = useViewPreferenceStore((s) => s.folderIsAsc);
  const folderOrder = useViewPreferenceStore((s) => s.folderOrder);
  return useQuery({
    ...q.folders.detail(folderOrder, folderIsAsc, folderPath),
    select: ({ directories, tracks }) => ({
      directories,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.artistName ?? "—",
        imageSource: track.artwork,
      })),
    }),
  });
}
//#endregion
