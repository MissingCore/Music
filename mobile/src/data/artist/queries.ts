import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { queries as q } from "../keyStore";

//#region Queries
export function useArtist(artistName: string) {
  return useQuery({ ...q.artists.detail(artistName) });
}

export function useArtistForScreen(artistName: string) {
  const { t } = useTranslation();
  const isAsc = useViewPreferenceStore((s) => s.artistTracksIsAsc);
  const order = useViewPreferenceStore((s) => s.artistTracksOrder);

  return useQuery({
    ...q.artists.detail(artistName, { isAsc, order }),
    select: ({ name, artwork, albums, tracks, duration }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.artist"),
        t("plural.track", { count: tracks.length }),
        duration,
      ],
      albums: albums.length > 0 ? albums : null,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.albumName ?? "—",
        imageSource: track.artwork,
      })),
    }),
  });
}

export function useArtists() {
  return useQuery({ ...q.artists.all });
}
//#endregion
