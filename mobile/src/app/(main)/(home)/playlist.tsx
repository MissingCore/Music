import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { getPlaylists } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { Add } from "@/resources/icons";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { playlistKeys } from "@/constants/QueryKeys";
import { Colors } from "@/constants/Styles";
import { Button } from "@/components/new/Form";
import { MediaCardList } from "@/modules/media/components";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = usePlaylistsForMediaCard();
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <StickyActionLayout
      title={t("common.playlists")}
      StickyAction={
        <Button
          preset="danger"
          // FIXME: Temporary until we implement the new "Create Playlist" screen.
          onPress={() => openModal({ entity: "playlist", scope: "new" })}
          icon
        >
          <Add color={Colors.neutral100} />
        </Button>
      }
    >
      <MediaCardList
        data={data}
        isLoading={isPending}
        emptyMessage={t("response.noPlaylists")}
      />
    </StickyActionLayout>
  );
}

//#region Data
const usePlaylistsForMediaCard = () =>
  useQuery({
    queryKey: playlistKeys.all,
    queryFn: () => getPlaylists(),
    staleTime: Infinity,
    select: (results) =>
      results
        .map((data) => formatForMediaCard({ type: "playlist", data }))
        .sort((a, b) => a.title.localeCompare(b.title)),
  });
//#endregion
