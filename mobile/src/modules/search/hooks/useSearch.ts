import { useQuery } from "@tanstack/react-query";
import { ne } from "drizzle-orm";
import { useEffect, useRef, useState } from "react";

import { db } from "~/db";
import { playlists } from "~/db/schema";

import { getAlbumsSummary } from "~/data/album/api";
import { AlbumArtistsKey } from "~/data/album/utils";
import { getArtistsSummary } from "~/data/artist/api";
import { getPlaylistsSummary } from "~/data/playlist/api";
import { getTracks } from "~/data/track/api";
import type { CommonTrack } from "~/data/types";

import { addTrailingSlash } from "~/utils/string";
import type { Prettify } from "~/utils/types";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type {
  SearchCategories,
  SearchFolderResult,
  SearchResults,
} from "../types";
import { lowerHas, lowerStart, matchSort } from "../utils";

/** Returns media specified by query in the given scope. */
export function useSearch<TScope extends SearchCategories>(
  scope: TScope,
  query?: string,
): Prettify<Pick<SearchResults, TScope[number]>> | undefined {
  const { data } = useAllMedia();
  const scopeRef = useRef(scope); // Scope shouldn't be dynamically changed.
  const [cache, setCache] = useState<Record<string, Pick<SearchResults, any>>>(
    {},
  );
  const prevDefinedValueRef = useRef<
    Pick<SearchResults, TScope[number]> | undefined
  >(undefined);

  useEffect(() => {
    if (!data || !query) {
      // Don't display prior value if query gets cleared.
      prevDefinedValueRef.current = undefined;
      return;
    }

    const q = query.toLocaleLowerCase();
    if (cache[q]) return;

    setCache((prev) => ({
      ...prev,
      [q]: Object.fromEntries(
        scopeRef.current.map((mediaType) => {
          let results: Array<{ name: string }> = [];

          if (mediaType === "album") {
            results = data[mediaType].filter(
              (i) =>
                lowerHas(i.name, q) ||
                // Album's artist name starts with the query.
                AlbumArtistsKey.deconstruct(i.artistsKey).some((artistName) =>
                  lowerStart(artistName, q),
                ),
            );
          } else if (mediaType === "folder") {
            results = data[mediaType].filter(
              // Folder's path includes the query.
              (i) => lowerHas(i.name, q) || lowerHas(i.path, q),
            );
          } else if (mediaType === "track") {
            results = data[mediaType].filter(
              ({ name, artists, album }) =>
                lowerHas(name, q) ||
                // One of track's artist names starts with the query.
                artists?.some((i) => lowerStart(i, q)) ||
                // Track's album starts with the query.
                lowerStart(album || undefined, q),
            );
          } else {
            results = data[mediaType].filter((i) => lowerHas(i.name, q));
          }

          return [mediaType, matchSort(results, (i) => lowerStart(i.name, q))];
        }),
      ),
    }));
  }, [data, query, cache]);

  if (query) {
    const result = cache[query.toLocaleLowerCase()];
    // Stores last shown value to prevent flashing.
    if (result) prevDefinedValueRef.current = result;
    else if (result === undefined) {
      // Keep showing the prior results while computation is still ongoing to prevent flashing.
      return prevDefinedValueRef.current;
    }
    return result as Pick<SearchResults, TScope[number]>;
  }
  return undefined;
}

//#region Helpers
async function getAllMedia() {
  // Maybe manually building the query would be faster, but would be a bit
  // too complicated to read.
  const [allAlbums, allArtists, allFolders, allPlaylists, allTracks] =
    await Promise.all([
      getAlbumsSummary(true),
      getArtistsSummary(),
      db.query.fileNodes.findMany({
        orderBy: (f, { asc }) => [asc(f.parentPath), asc(f.name)],
      }),
      getPlaylistsSummary(false, [ne(playlists.name, FavoritesPlaylistKey)]),
      getTracks(),
    ]);

  // Pre-group the tracks by their `parentFolder` to make things a lot faster.
  const groupedTracks: Record<string, CommonTrack[]> = {};
  allTracks.forEach(({ parentFolder, ...t }) => {
    if (!parentFolder) return;

    if (groupedTracks[parentFolder]) groupedTracks[parentFolder].push(t);
    else groupedTracks[parentFolder] = [t];
  });

  return {
    album: allAlbums,
    artist: allArtists.map(({ name, artwork }) => ({ name, artwork })),
    folder: (allFolders as SearchFolderResult[])
      .map((f) => {
        f.tracks = groupedTracks[`file:///${addTrailingSlash(f.path)}`] ?? [];
        return f;
      })
      .filter(({ tracks }) => tracks.length > 0),
    playlist: allPlaylists.map(({ name, artwork }) => ({ name, artwork })),
    track: allTracks.map(({ parentFolder: _, ...t }) => t),
  } satisfies SearchResults;
}

const queryKey = ["search"];

export function useAllMedia() {
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
