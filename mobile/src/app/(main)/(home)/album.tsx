import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getAlbums } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { StickyActionListLayout } from "@/layouts";

import { albumKeys } from "@/constants/QueryKeys";
import { useMediaCardListPreset } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useAlbumsForMediaCard();
  const presets = useMediaCardListPreset({
    ...{ data, isPending },
    emptyMessage: t("response.noAlbums"),
  });

  return <StickyActionListLayout title={t("common.albums")} {...presets} />;
}

//#region Data
const useAlbumsForMediaCard = () =>
  useQuery({
    queryKey: albumKeys.all,
    queryFn: () => getAlbums(),
    staleTime: Infinity,
    select: (data) =>
      data
        .map((album) => formatForMediaCard({ type: "album", data: album }))
        .sort(
          (a, b) =>
            a.title.localeCompare(b.title) ||
            a.subtitle.localeCompare(b.subtitle),
        ),
  });
//#endregion
