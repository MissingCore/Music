import { queryOptions, useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { db } from "@/db";
import { artists } from "@/db/schema";
import { getArtist } from "@/db/queries";
import { formatForCurrentPages } from "@/db/utils/formatters";
import { artistKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

async function getArtistInfo(artistName: string) {
  return {
    ...(await getArtist([eq(artists.name, artistName)])),
    albums: await db.query.albums.findMany({
      where: (fields) => eq(fields.artistName, artistName),
      orderBy: (fields, { desc }) => desc(fields.releaseYear),
    }),
  };
}

type QueryFnData = ExtractFnReturnType<typeof getArtistInfo>;

/** Returns specified artist with its tracks. */
export const artistOptions = (artistName: string) =>
  queryOptions({
    queryKey: artistKeys.detail(artistName),
    queryFn: () => getArtistInfo(artistName),
    staleTime: Infinity,
  });

/**
 * Return data to render "MediaList" components on the `/artist/[id]`
 * route.
 */
export const useArtistForCurrentPage = (artistName: string) =>
  useQuery({
    ...artistOptions(artistName),
    select: useCallback(
      ({ albums, ...data }: QueryFnData) => ({
        ...formatForCurrentPages({ type: "artist", data }),
        albums: albums.length > 0 ? albums : null,
      }),
      [],
    ),
  });
