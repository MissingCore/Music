import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getAlbums } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";
import { albumKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getAlbums>;

type UseAlbumsOptions<TData = QueryFnData> = {
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns all albums with its tracks. */
export const useAlbums = <TData = QueryFnData>({
  config,
}: UseAlbumsOptions<TData>) =>
  useQuery({
    queryKey: albumKeys.all,
    queryFn: () => getAlbums(),
    staleTime: Infinity,
    ...config,
  });

/** @description Returns a list of `MediaCardContent` generated from albums. */
export const useAlbumsForMediaCard = () =>
  useAlbums({
    config: {
      select: useCallback(
        (data: QueryFnData) =>
          data
            .map((album) => formatForMediaCard({ type: "album", data: album }))
            .toSorted(
              (a, b) =>
                a.title.localeCompare(b.title) ||
                a.subtitle.localeCompare(b.subtitle),
            ),
        [],
      ),
    },
  });
