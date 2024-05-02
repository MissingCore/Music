import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { ArtistWithTracks } from "@/db/schema";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { artistKeys } from "./_queryKeys";

import type { Prettify } from "@/utils/types";

type BaseFnArgs = { artistName: string };

type QueryFnData = ArtistWithTracks;

export async function getArtist({ artistName }: BaseFnArgs) {
  const currentArtist = await db.query.artists.findFirst({
    where: (fields, { eq }) => eq(fields.name, artistName),
    with: { tracks: { with: { album: true } } },
  });
  if (!currentArtist) throw new Error(`Artist ${artistName} doesn't exist.`);
  return currentArtist;
}

type UseArtistOptions<TData = QueryFnData> = Prettify<
  BaseFnArgs & {
    config?: {
      select?: (data: QueryFnData) => TData;
    };
  }
>;

/** @description Returns specified artist with its tracks. */
export const useArtist = <TData = QueryFnData>({
  artistName,
  config,
}: UseArtistOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: artistKeys.detail(artistName),
    queryFn: () => getArtist({ artistName }),
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(artistKeys.all)
        ?.find((d) => d?.name === artistName);
    },
    staleTime: Infinity,
    ...config,
  });
};

/**
 * @description Return data to render "MediaList" components on the
 *  `/artist/[id]` route.
 */
export const useArtistForCurrentPage = (artistName: string) =>
  useArtist({
    artistName,
    config: {
      select: useCallback(
        (data: QueryFnData) => formatForCurrentPages({ type: "artist", data }),
        [],
      ),
    },
  });
