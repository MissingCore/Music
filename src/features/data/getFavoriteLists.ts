import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import { getTrackCountStr } from "@/features/track/utils";
import { assortedDataKeys } from "./queryKeys";

type FavoriteList = {
  type: "album" | "playlist";
  ref: string;
  title: string;
  subtitle: string;
  extra?: string;
  imgSrc: string | null;
};

async function getFavoriteLists() {
  const favAlbums = (
    await db.query.albums.findMany({
      where: (fields, { eq }) => eq(fields.isFavorite, true),
      columns: { id: true, name: true, coverSrc: true, artistName: true },
      with: { tracks: { columns: { id: true } } },
    })
  ).map(({ id, name, artistName, tracks, coverSrc }) => ({
    ...{ type: "album", ref: id, title: name, subtitle: artistName },
    ...{ extra: `| ${getTrackCountStr(tracks.length)}`, imgSrc: coverSrc },
  }));

  return [...favAlbums].toSorted((a, b) =>
    a.title.localeCompare(b.title),
  ) as FavoriteList[];
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
