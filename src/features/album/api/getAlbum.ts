import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { getPlayTime } from "@/components/media/utils";
import { trackCountStr } from "@/features/track/utils";

/** @description Fetch all albums with their relations from database. */
export async function getAlbum(albumId: string) {
  return await db.query.albums.findFirst({
    where: (fields, { eq }) => eq(fields.id, albumId),
    with: {
      artist: true,
      tracks: {
        orderBy: (fields, { asc }) => [asc(fields.track)],
      },
    },
  });
}

type QueryFnType = typeof getAlbum;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified album. */
export const useAlbumQuery = <TData = QueryFnData>(
  albumId: string,
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: ["album", albumId],
    queryFn: () => getAlbum(albumId),
    select,
  });

/** @description Format the album; grouping the metadata. */
export const useFormattedAlbum = (albumId: string) =>
  useAlbumQuery(albumId, (data: QueryFnData) => {
    if (!data) return undefined;
    const metadata = [];

    if (data.releaseYear) metadata.push(String(data.releaseYear));
    metadata.push(trackCountStr(data.tracks.length));
    metadata.push(
      getPlayTime(
        data.tracks.reduce((total, curr) => total + curr.duration, 0),
      ),
    );

    return { ...data, metadata };
  });
