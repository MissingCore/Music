import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AlbumArtistsKey } from "~/api/album.utils";
import { queries as q } from "~/queries/keyStore";

import { formatSeconds } from "~/utils/number";

//#region Queries
export function useAlbum(albumId: string) {
  return useQuery({ ...q.albums.detail(albumId) });
}

export function useAlbumForScreen(albumId: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.albums.detail(albumId),
    select: ({ name, artistsKey, artwork, isFavorite, tracks, year }) => {
      const albumArtists = AlbumArtistsKey.deconstruct(artistsKey);

      return {
        name,
        imageSource: artwork,
        metadata: [
          t("term.album"),
          ...(year ? [year] : []),
          t("plural.track", { count: tracks.length }),
          formatSeconds(
            tracks.reduce((total, curr) => total + curr.duration, 0),
          ),
        ],
        tracks: tracks.map(({ name: title, duration, artists, ...rest }) => {
          let description = formatSeconds(duration);
          const diffArtists = artists.filter(
            (name) => !albumArtists.includes(name),
          );
          if (diffArtists.length > 0) {
            description += ` • ${diffArtists.join(", ")}`;
          }

          return { ...rest, title, description, imageSource: null };
        }),

        artists: albumArtists,
        isFavorite,
      };
    },
  });
}

export function useAlbums() {
  return useQuery({ ...q.albums.all });
}
//#endregion
