import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { Add } from "@/resources/icons";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { Colors } from "@/constants/Styles";
import { Button } from "@/components/new/Form";
import { MediaCardList } from "@/modules/media/components";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { t } = useTranslation();
  const { data } = usePlaylistsForMediaCard();
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
      <MediaCardList data={data} emptyMessage={t("response.noPlaylists")} />
    </StickyActionLayout>
  );
}
