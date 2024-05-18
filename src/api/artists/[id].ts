import { queryOptions, useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { artists } from "@/db/schema";
import { getArtist } from "@/db/queries";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { artistKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getArtist>;

/** @description Returns specified artist with its tracks. */
export const artistOptions = (artistName: string) =>
  queryOptions({
    queryKey: artistKeys.detail(artistName),
    queryFn: () => getArtist([eq(artists.name, artistName)]),
    staleTime: Infinity,
  });

/**
 * @description Return data to render "MediaList" components on the
 *  `/artist/[id]` route.
 */
export const useArtistForCurrentPage = (artistName: string) =>
  useQuery({
    ...artistOptions(artistName),
    select: useCallback(
      (data: QueryFnData) => formatForCurrentPages({ type: "artist", data }),
      [],
    ),
  });
