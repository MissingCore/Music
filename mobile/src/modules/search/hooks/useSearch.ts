import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "@/db/schema";

import { getAlbums } from "@/api/album";
import { getArtists } from "@/api/artist";
import { getPlaylists } from "@/api/playlist";
import { getTracks } from "@/api/track";

import type { Prettify } from "@/utils/types";
import type { MediaType } from "@/modules/media/types";

type Results = {
  album: AlbumWithTracks[];
  artist: ArtistWithTracks[];
  // folder: unknown[];
  playlist: PlaylistWithTracks[];
  track: TrackWithAlbum[];
};

/** Returns media specified by query in the given scope. */
export function useSearch<
  TScope extends ReadonlyArray<Exclude<MediaType, "folder">>,
>(
  scope: TScope,
  query?: string,
): Prettify<Pick<Results, TScope[number]>> | undefined {
  const { data } = useAllMedia();
  return useMemo(() => {
    if (!data || !query) return undefined;
    let q = query.toLowerCase();
    // Keep results if we have a partial match with the "name".
    return Object.fromEntries(
      scope.map((mediaType) => [
        mediaType,
        data[mediaType].filter((item) => item.name.toLowerCase().includes(q)),
      ]),
    ) as Pick<Results, TScope[number]>;
  }, [data, query, scope]);
}

//#region Helpers
async function getAllMedia() {
  return {
    album: await getAlbums(),
    artist: await getArtists(),
    playlist: await getPlaylists(),
    track: (await getTracks()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const queryKey = ["search"];

function useAllMedia() {
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
