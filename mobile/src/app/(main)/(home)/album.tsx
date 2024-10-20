import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getAlbums } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { albumKeys } from "@/constants/QueryKeys";
import { MediaCardList } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useAlbumsForMediaCard();

  return (
    <StickyActionLayout title={t("common.albums")}>
      <MediaCardList
        data={data}
        isLoading={isPending}
        emptyMessage={t("response.noAlbums")}
      />
    </StickyActionLayout>
  );
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
