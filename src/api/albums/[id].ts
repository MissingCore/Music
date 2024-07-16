import { queryOptions, useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { albums } from "@/db/schema";
import { getAlbum } from "@/db/queries";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { albumKeys } from "./_queryKeys";

import { pickKeys } from "@/utils/object";
import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getAlbum>;

/** Returns specified album with its tracks. */
export const albumOptions = (albumId: string) =>
  queryOptions({
    queryKey: albumKeys.detail(albumId),
    queryFn: () => getAlbum([eq(albums.id, albumId)]),
    staleTime: Infinity,
  });

/**
 * Return data to render "MediaList" components on the `/album/[id]`
 * route.
 */
export const useAlbumForCurrentPage = (albumId: string) =>
  useQuery({
    ...albumOptions(albumId),
    select: useCallback(
      (data: QueryFnData) => ({
        ...formatForCurrentPages({ type: "album", data }),
        ...pickKeys(data, ["artistName", "isFavorite"]),
        imageSource: data.artwork,
      }),
      [],
    ),
  });
