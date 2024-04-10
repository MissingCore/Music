import { useQuery } from "@tanstack/react-query";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { albums } from "@/db/schema";

import type { ExtractFnReturnType } from "@/lib/react-query";

/** @description Fetch all albums with their relations from database. */
export async function getAlbums() {
  return await db.query.albums.findMany({
    with: { artist: true, tracks: true },
    orderBy: [asc(albums.name)],
  });
}

type QueryFnType = typeof getAlbums;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all albums with its relations, unmodified. */
export const useAlbumsQuery = <TData = QueryFnData>(
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: ["all-albums"],
    queryFn: getAlbums,
    select,
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** @description Return all albums w/ their artist name & track count. */
export const useFormattedAlbums = () =>
  useAlbumsQuery((data: QueryFnData) =>
    data.map(({ tracks, artist, ...rest }) => {
      return { ...rest, numTracks: tracks.length, artistName: artist.name };
    }),
  );
