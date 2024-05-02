import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { albums } from "@/db/schema";
import { getAlbum } from "@/db/queries";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { albumKeys } from "./_queryKeys";

import { pickKeys } from "@/utils/object";
import type { ExtractFnReturnType, Prettify } from "@/utils/types";

type BaseFnArgs = { albumId: string };

type QueryFnData = ExtractFnReturnType<typeof getAlbum>;

type UseAlbumOptions<TData = QueryFnData> = Prettify<
  BaseFnArgs & {
    config?: {
      select?: (data: QueryFnData) => TData;
    };
  }
>;

/** @description Returns specified album with its tracks. */
export const useAlbum = <TData = QueryFnData>({
  albumId,
  config,
}: UseAlbumOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: albumKeys.detail(albumId),
    queryFn: () => getAlbum([eq(albums.id, albumId)]),
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(albumKeys.all)
        ?.find((d) => d?.id === albumId);
    },
    staleTime: Infinity,
    ...config,
  });
};

/**
 * @description Return data to render "MediaList" components on the
 *  `/album/[id]` route.
 */
export const useAlbumForCurrentPage = (albumId: string) =>
  useAlbum({
    albumId,
    config: {
      select: useCallback(
        (data: QueryFnData) => ({
          ...formatForCurrentPages({ type: "album", data }),
          ...pickKeys(data, ["artistName", "isFavorite"]),
          imageSource: data.coverSrc,
        }),
        [],
      ),
    },
  });
