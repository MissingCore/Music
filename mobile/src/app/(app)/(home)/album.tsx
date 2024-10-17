import { useTranslation } from "react-i18next";

import { useAlbumsForMediaCard } from "@/api/albums";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { MediaCardList } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const { data } = useAlbumsForMediaCard();

  return (
    <StickyActionLayout title={t("common.albums")}>
      <MediaCardList data={data} emptyMessage={t("response.noAlbums")} />
    </StickyActionLayout>
  );
}
