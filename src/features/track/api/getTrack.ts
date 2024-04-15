import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { trackKeys } from "./queryKeys";

type QueryKeyType = ReturnType<typeof trackKeys.detail>;
type QueryFnOpts = QueryFunctionContext<QueryKeyType>;

async function getTrack({ queryKey: [{ id }] }: QueryFnOpts) {
  const currentTrack = await db.query.tracks.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    with: { artist: true, album: true },
  });
  if (!currentTrack) throw new Error(`Track (${id}) does not exist.`);
  return currentTrack;
}

type QueryFnType = typeof getTrack;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified track. */
export const useTrack = (trackId: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    // Run query only when `trackId` is defined.
    enabled: Boolean(trackId),
    queryKey: trackKeys.detail(trackId!),
    queryFn: getTrack,
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(trackKeys.all)
        ?.find((d) => d?.id === trackId);
    },
    // Data returned from `select` doesn't get saved to the cache.
    select: formatTrack,
    staleTime: Infinity,
  });
};

/** @description Formats the track information recieved. */
function formatTrack({
  id,
  name,
  artistName,
  duration,
  uri,
  isFavorite,
  ...rest
}: QueryFnData) {
  const albumInfo = rest.album
    ? { id: rest.album.id, name: rest.album.name }
    : null;

  return {
    ...{ id, name, artistName, duration, uri, isFavorite },
    album: albumInfo,
    coverSrc: rest.album?.coverSrc ?? rest.coverSrc,
  };
}

export type UseTrackData = ReturnType<typeof formatTrack>;
