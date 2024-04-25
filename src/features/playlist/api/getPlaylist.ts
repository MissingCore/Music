import type { QueryFunctionContext } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { getPlayTime } from "@/components/media/utils";
import { getTrackCountStr } from "@/features/track/utils";
import { playlistKeys } from "./queryKeys";

type QueryKeyType = ReturnType<typeof playlistKeys.detail>;
type QueryFnOpts = QueryFunctionContext<QueryKeyType>;

async function getPlaylist({ queryKey: [{ name }] }: QueryFnOpts) {
  const currentPlaylist = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, name),
    with: {
      tracksToPlaylists: {
        columns: { trackId: false, playlistName: false },
        with: {
          track: {
            with: { album: true },
          },
        },
      },
    },
  });
  if (!currentPlaylist) throw new Error(`Playlist (${name}) does not exist.`);
  return currentPlaylist;
}

type QueryFnType = typeof getPlaylist;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets specified playlist. */
export const usePlaylist = (playlistName: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    enabled: Boolean(playlistName),
    queryKey: playlistKeys.detail(playlistName!),
    queryFn: getPlaylist,
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(playlistKeys.all)
        ?.find((d) => d?.name === playlistName);
    },
    // Data returned from `select` doesn't get saved to the cache.
    select: formatPlaylistTracks,
    staleTime: Infinity,
  });
};

/** @description Formats the tracks associated with the playlist. */
function formatPlaylistTracks({
  coverSrc,
  tracksToPlaylists,
  ...rest
}: QueryFnData) {
  const tracks = tracksToPlaylists
    .map(({ track: { id, name, artistName, duration, album, coverSrc } }) => ({
      ...{ id, name, artistName, duration },
      coverSrc: album?.coverSrc ?? coverSrc,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));

  return {
    ...{ ...rest, tracks },
    coverSrc: coverSrc ?? tracks.slice(0, 4).map(({ coverSrc }) => coverSrc),
    metadata: [
      getTrackCountStr(tracks.length),
      getPlayTime(tracks.reduce((total, curr) => total + curr.duration, 0)),
    ],
  };
}
