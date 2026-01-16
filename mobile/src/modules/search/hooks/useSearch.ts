import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { db } from "~/db";
import type { SlimFolder, SlimTrackWithAlbum } from "~/db/slimTypes";

import { getAlbums } from "~/api/album";
import { AlbumArtistsKey } from "~/api/album.utils";
import { getPlaylists } from "~/api/playlist";
import { getTracks } from "~/api/track";

import { iAsc } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import type { Prettify } from "~/utils/types";
import type { SearchCategories, SearchResults } from "../types";
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
  const prevDefinedValueRef = useRef<Pick<SearchResults, any>>({});

  useEffect(() => {
    if (!data || !query) return;

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
              ({ name, tracksToArtists, album }) =>
                lowerHas(name, q) ||
                // One of track's artist names starts with the query.
                tracksToArtists.some((i) => lowerStart(i.artistName, q)) ||
                // Track's album starts with the query.
                lowerStart(album?.name, q),
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
      return prevDefinedValueRef.current as Pick<SearchResults, TScope[number]>;
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
      getAlbums({
        columns: ["id", "name", "artistsKey", "artwork"],
        trackColumns: ["id", "name", "artwork"],
      }),
      db.query.artists.findMany({
        orderBy: (fields) => iAsc(fields.name),
        //? Relation used to filter out artists with no tracks.
        with: { tracksToArtists: { columns: { trackId: true }, limit: 1 } },
      }),
      db.query.fileNodes.findMany({
        orderBy: (f, { asc }) => [asc(f.parentPath), asc(f.name)],
      }),
      getPlaylists({
        columns: ["name", "artwork"],
        trackColumns: ["artwork"],
        albumColumns: ["artwork"],
      }),
      getTracks({
        columns: ["id", "name", "artwork", "parentFolder"],
        albumColumns: ["name", "artwork"],
      }),
    ]);

  // Pre-group the tracks by their `parentFolder` to make things a lot faster.
  const groupedTracks: Record<string, SlimTrackWithAlbum[]> = {};
  allTracks.forEach(({ parentFolder, ...t }) => {
    if (!parentFolder) return;

    if (groupedTracks[parentFolder]) groupedTracks[parentFolder].push(t);
    else groupedTracks[parentFolder] = [t];
  });

  return {
    album: allAlbums.filter(({ tracks }) => tracks.length > 0),
    artist: allArtists
      .filter(({ tracksToArtists }) => tracksToArtists.length > 0)
      .map(({ tracksToArtists: _, ...artist }) => artist),
    folder: (allFolders as SlimFolder[])
      .map((f) => {
        f.tracks = groupedTracks[`file:///${addTrailingSlash(f.path)}`] ?? [];
        return f;
      })
      .filter(({ tracks }) => tracks.length > 0),
    playlist: allPlaylists.map(({ tracks, ...playlist }) => ({
      ...playlist,
      tracks: tracks.map(({ tracksToArtists: _, ...track }) => track),
    })),
    track: allTracks.map(({ parentFolder: _, ...t }) => t),
  } satisfies SearchResults;
}

const queryKey = ["search"];

export function useAllMedia() {
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
