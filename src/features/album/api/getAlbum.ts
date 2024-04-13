import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { getPlayTime } from "@/components/media/utils";
import { trackCountStr } from "@/features/track/utils";
import { albumKeys } from "./queryKeys";

type QueryKeyType = ReturnType<typeof albumKeys.detail>;
type QueryFnOpts = QueryFunctionContext<QueryKeyType>;

async function getAlbum({ queryKey: [{ id }] }: QueryFnOpts) {
  const currentAlbum = await db.query.albums.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    with: { artist: true, tracks: true },
  });
  if (!currentAlbum) throw new Error(`Album (${id}) does not exist.`);
  return currentAlbum;
}

type QueryFnType = typeof getAlbum;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified album. */
export const useAlbum = (albumId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: albumKeys.detail(albumId),
    queryFn: getAlbum,
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(albumKeys.all)
        ?.find((d) => d?.id === albumId);
    },
    // Data returned from `select` doesn't get saved to the cache.
    select: formatAlbumTracks,
    staleTime: Infinity,
  });
};

/** @description Formats the tracks associated with the album. */
function formatAlbumTracks({
  releaseYear,
  tracks,
  artist: _,
  ...rest
}: QueryFnData) {
  const metadata = [];
  if (releaseYear) metadata.push(String(releaseYear));
  metadata.push(trackCountStr(tracks.length));
  metadata.push(
    getPlayTime(tracks.reduce((total, curr) => total + curr.duration, 0)),
  );

  return {
    ...rest,
    tracks: tracks
      .toSorted((a, b) => a.track - b.track)
      .map(({ id, name, duration, uri, track }) => {
        return { id, name, duration, uri, track };
      }),
    metadata,
  };
}
