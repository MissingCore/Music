// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { getFolder } from "./api";

//#region Queries
export function useFolderContent(folderPath?: string) {
  const isAsc = useViewPreferenceStore((s) => s.folderIsAsc);
  const order = useViewPreferenceStore((s) => s.folderOrder);

  const sortOptions = { isAsc, order };

  return useQuery({
    queryKey: ["folders", "detail", folderPath, sortOptions],
    queryFn: () => getFolder(folderPath, sortOptions),
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
