import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { MediaCardContent } from "@/components/media/MediaCard";
import { getTrackCountStr } from "@/features/track/utils";
import { assortedDataKeys } from "./queryKeys";

async function getFavoriteLists<T>() {
  const favAlbums = (
    await db.query.albums.findMany({
      where: (fields, { eq }) => eq(fields.isFavorite, true),
      columns: { id: true, name: true, coverSrc: true, artistName: true },
      with: { tracks: { columns: { id: true } } },
    })
  ).map(({ id, name, artistName, tracks, coverSrc }) => ({
    type: "album",
    href: `/album/${id}`,
    title: name,
    subtitle: artistName,
    extra: `| ${getTrackCountStr(tracks.length)}`,
    source: coverSrc,
  }));
  const favPlaylists = (
    await db.query.playlists.findMany({
      where: (fields, { eq }) => eq(fields.isFavorite, true),
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
    })
  ).map(({ name, coverSrc, tracksToPlaylists }) => ({
    type: "playlist",
    href: `/playlist/${name}`,
    title: name,
    subtitle: getTrackCountStr(tracksToPlaylists.length),
    source:
      coverSrc ??
      tracksToPlaylists
        .toSorted((a, b) => a.track.name.localeCompare(b.track.name))
        .slice(0, 4)
        .map(({ track }) => track.album?.coverSrc ?? track.coverSrc),
  }));

  return [...favAlbums, ...favPlaylists].toSorted((a, b) =>
    a.title.localeCompare(b.title),
  ) as Array<MediaCardContent<T>>;
}

/**
 * @description Get enough information to render `<MediaCard />` for
 *  each list we favorite (albums & playlists).
 */
export const useFavoriteLists = () =>
  useQuery({
    queryKey: assortedDataKeys.favoriteLists,
    queryFn: getFavoriteLists,
    staleTime: Infinity,
  });
