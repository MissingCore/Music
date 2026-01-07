import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatForMediaCard, getYearRange } from "~/db/utils";

import { favoriteAlbum, updateAlbum } from "~/api/album";
import { AlbumArtistsKey } from "~/api/album.utils";
import { Resynchronize } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { queries as q } from "./keyStore";

import { clearAllQueries } from "~/lib/react-query";
import { formatSeconds } from "~/utils/number";
import { wait } from "~/utils/promise";

//#region Queries
/** Get specified album. */
export function useAlbum(albumId: string) {
  return useQuery({ ...q.albums.detail(albumId) });
}

/** Format album information for album's `(current)` screen. */
export function useAlbumForScreen(albumId: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.albums.detail(albumId),
    select: ({ name, artistsKey, artwork, isFavorite, tracks }) => {
      const albumArtists = AlbumArtistsKey.deconstruct(artistsKey);
      const { range } = getYearRange(tracks);

      return {
        name,
        imageSource: artwork,
        metadata: [
          t("plural.track", { count: tracks.length }),
          formatSeconds(
            tracks.reduce((total, curr) => total + curr.duration, 0),
          ),
          ...(range !== null ? [range] : []),
        ],
        tracks: tracks.map(
          ({ id, name: title, disc, track, duration, tracksToArtists }) => {
            let description = formatSeconds(duration);
            const artistNames = tracksToArtists
              .map((rel) => rel.artistName)
              .filter((name) => !albumArtists.includes(name));
            if (artistNames.length > 0) {
              description += ` • ${artistNames.join(", ")}`;
            }

            return { id, title, description, imageSource: null, disc, track };
          },
        ),

        artistNames: albumArtists,
        isFavorite,
      };
    },
  });
}

/** Return list of `MediaCardContent` from albums. */
export function useAlbumsForCards() {
  const { t } = useTranslation();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  return useQuery({
    ...q.albums.all,
    select: (data) =>
      data
        .filter(({ tracks }) => tracks.length > minAlbumLength)
        .map((album) => formatForMediaCard({ type: "album", data: album, t })),
  });
}
//#endregion

//#region Mutations
/** Set the favorite status of an album. */
export function useFavoriteAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** Pass the new favorite status of the album. */
    mutationFn: async (isFavorite: boolean) => {
      await wait(1);
      await favoriteAlbum(albumId, isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: q.albums.detail(albumId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: q.favorites.lists.queryKey });
    },
  });
}

/** Update specified album artwork. */
export function useUpdateAlbumArtwork(albumId: string) {
  return useMutation({
    mutationFn: ({ artwork }: { artwork?: string | null }) =>
      updateAlbum(albumId, { altArtwork: artwork }),
    onSuccess: async () => {
      // Changing the album artwork affects a lot of things, so we'll just
      // clear all the queries.
      clearAllQueries();

      // Revalidate `activeTrack` in Playback store if needed.
      await Resynchronize.onActiveTrack({ type: "album", id: albumId });
    },
  });
}
//#endregion
