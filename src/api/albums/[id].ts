import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { AlbumWithTracks } from "@/db/schema";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { albumKeys } from "./_queryKeys";

import { pickKeys } from "@/utils/object";
import type { Prettify } from "@/utils/types";

type BaseFnArgs = { albumId: string };

type QueryFnData = AlbumWithTracks;

export async function getAlbum({ albumId }: BaseFnArgs) {
  const currentAlbum = await db.query.albums.findFirst({
    where: (fields, { eq }) => eq(fields.id, albumId),
    with: { tracks: true },
  });
  if (!currentAlbum) throw new Error(`Album ${albumId} doesn't exist.`);
  return currentAlbum;
}

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
    queryFn: () => getAlbum({ albumId }),
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
