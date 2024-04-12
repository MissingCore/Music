import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { compareAsc } from "@/utils/string";
import { getPlayTime } from "@/components/media/utils";
import { trackCountStr } from "@/features/track/utils";
import { artistKeys } from "./queryKeys";

type QueryKeyType = ReturnType<typeof artistKeys.detail>;
type QueryFnOpts = QueryFunctionContext<QueryKeyType>;

async function getArtist({ queryKey: [{ id }] }: QueryFnOpts) {
  const currentArtist = await db.query.artists.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    with: { tracks: { with: { album: true } } },
  });
  if (!currentArtist) throw new Error(`Artist with id (${id}) does not exist.`);
  return currentArtist;
}

type QueryFnType = typeof getArtist;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified artist. */
export const useArtist = (artistId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: artistKeys.detail(artistId),
    queryFn: getArtist,
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(artistKeys.all)
        ?.find((d) => d?.id === artistId);
    },
    // Data returned from `select` doesn't get saved to the cache.
    select: formatArtistTracks,
    staleTime: Infinity,
  });
};

/** @description Formats the tracks the artist created. */
function formatArtistTracks(data: QueryFnData) {
  const metadata = [
    trackCountStr(data.tracks.length),
    getPlayTime(data.tracks.reduce((total, curr) => total + curr.duration, 0)),
  ];

  // Make sure track `coverSrc` is inherited from its album.
  const formattedTracks = data.tracks
    .map(({ id, name, duration, uri, album, coverSrc, ..._ }) => ({
      ...{ id, name, duration, uri },
      coverSrc: album ? album.coverSrc : coverSrc,
      albumName: album?.name,
    }))
    .toSorted(
      (a, b) =>
        compareAsc(a.albumName, b.albumName) || compareAsc(a.name, b.name),
    );

  return { ...data, tracks: formattedTracks, metadata };
}
