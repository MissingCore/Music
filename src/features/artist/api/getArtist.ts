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

async function getArtist({ queryKey: [{ name }] }: QueryFnOpts) {
  const currentArtist = await db.query.artists.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
    with: { tracks: { with: { album: true } } },
  });
  if (!currentArtist) throw new Error(`Artist (${name}) does not exist.`);
  return currentArtist;
}

type QueryFnType = typeof getArtist;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified artist. */
export const useArtist = (artistName: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    enabled: Boolean(artistName),
    queryKey: artistKeys.detail(artistName!),
    queryFn: getArtist,
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(artistKeys.all)
        ?.find((d) => d?.name === artistName);
    },
    // Data returned from `select` doesn't get saved to the cache.
    select: formatArtistTracks,
    staleTime: Infinity,
  });
};

/** @description Formats the tracks the artist created. */
function formatArtistTracks({ name, tracks }: QueryFnData) {
  return {
    name,
    tracks: tracks
      .map(({ id, name, duration, uri, album, coverSrc }) => ({
        ...{ id, name, duration, uri },
        coverSrc: album ? album.coverSrc : coverSrc,
        albumName: album?.name,
      }))
      .toSorted(
        (a, b) =>
          compareAsc(a.albumName, b.albumName) || compareAsc(a.name, b.name),
      ),
    metadata: [
      trackCountStr(tracks.length),
      getPlayTime(tracks.reduce((total, curr) => total + curr.duration, 0)),
    ],
  };
}
