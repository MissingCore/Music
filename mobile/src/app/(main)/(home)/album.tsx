import { useTranslation } from "react-i18next";

import { useAlbumsForCards } from "@/queries/album";
import { StickyActionListLayout } from "@/layouts";

import { useMediaCardListPreset } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useAlbumsForCards();
  const presets = useMediaCardListPreset({
    ...{ data, isPending },
    emptyMessage: t("response.noAlbums"),
  });

  return <StickyActionListLayout title={t("common.albums")} {...presets} />;
}
