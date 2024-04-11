import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { getPlayTime } from "@/components/media/utils";
import { trackCountStr } from "@/features/track/utils";

/** @description Fetch current artist with their relations from database. */
export async function getArtist(artistId: string) {
  return await db.query.artists.findFirst({
    where: (fields, { eq }) => eq(fields.id, artistId),
    with: {
      tracks: {
        with: { album: true },
        orderBy: (fields, { asc }) => [asc(fields.name)],
      },
    },
  });
}

type QueryFnType = typeof getArtist;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified artist. */
export const useArtistQuery = <TData = QueryFnData>(
  artistId: string,
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: ["artist", artistId],
    queryFn: () => getArtist(artistId),
    select,
  });

/** @description Format the artist; grouping the metadata. */
export const useFormattedArtist = (artistId: string) =>
  useArtistQuery(artistId, (data: QueryFnData) => {
    if (!data) return undefined;
    const metadata = [
      trackCountStr(data.tracks.length),
      getPlayTime(
        data.tracks.reduce((total, curr) => total + curr.duration, 0),
      ),
    ];

    // Make sure track `coverSrc` is inherited from its album.
    const formattedTracks = data.tracks.map(({ coverSrc, ...rest }) => ({
      ...rest,
      coverSrc: rest.album ? rest.album.coverSrc : coverSrc,
    }));

    return { ...data, tracks: formattedTracks, metadata };
  });
