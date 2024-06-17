import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getAlbums } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";
import { albumKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getAlbums>;

/** @description Returns all albums with its tracks. */
export const albumsOptions = () =>
  queryOptions({
    queryKey: albumKeys.all,
    queryFn: () => getAlbums(),
    staleTime: Infinity,
  });

/** @description Returns a list of `MediaCardContent` generated from albums. */
export const useAlbumsForMediaCard = () =>
  useQuery({
    ...albumsOptions(),
    select: useCallback(
      (data: QueryFnData) =>
        data
          .map((album) => formatForMediaCard({ type: "album", data: album }))
          .sort(
            (a, b) =>
              a.title.localeCompare(b.title) ||
              a.subtitle.localeCompare(b.subtitle),
          ),
      [],
    ),
  });
