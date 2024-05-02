import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { artists } from "@/db/schema";
import { getArtist } from "@/db/queries";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { artistKeys } from "./_queryKeys";

import type { ExtractFnReturnType, Prettify } from "@/utils/types";

type BaseFnArgs = { artistName: string };

type QueryFnData = ExtractFnReturnType<typeof getArtist>;

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
    queryFn: () => getArtist([eq(artists.name, artistName)]),
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
