import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getAlbums } from "@/api/album";
import { getArtists } from "@/api/artist";
import { getPlaylists } from "@/api/playlist";
import { getTracks } from "@/api/track";

import type { Prettify } from "@/utils/types";
import type { SearchCategories, SearchResults } from "../types";

/** Returns media specified by query in the given scope. */
export function useSearch<TScope extends SearchCategories>(
  scope: TScope,
  query?: string,
): Prettify<Pick<SearchResults, TScope[number]>> | undefined {
  const { data } = useAllMedia();
  return useMemo(() => {
    if (!data || !query) return undefined;
    let q = query.toLocaleLowerCase();
    // Keep results if we have a partial match with the "name".
    return Object.fromEntries(
      scope.map((mediaType) => [
        mediaType,
        data[mediaType].filter((i) => i.name.toLocaleLowerCase().includes(q)),
      ]),
    ) as Pick<SearchResults, TScope[number]>;
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
