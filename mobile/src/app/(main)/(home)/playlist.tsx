import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { Add } from "@/icons";
import { usePlaylistsForCards } from "@/queries/playlist";
import { StickyActionListLayout } from "@/layouts";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { Colors } from "@/constants/Styles";
import { IconButton } from "@/components/new/Form";
import { useMediaCardListPreset } from "@/modules/media/components";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = usePlaylistsForCards();
  const presets = useMediaCardListPreset({
    ...{ data, isPending },
    emptyMessage: t("response.noPlaylists"),
  });

  return (
    <StickyActionListLayout
      title={t("common.playlists")}
      StickyAction={<PlaylistActions />}
      estimatedActionSize={48}
      {...presets}
    />
  );
}

//#region Actions
/** Actions used on the `/playlist` screen. */
function PlaylistActions() {
  const { t } = useTranslation();
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <IconButton
      accessibilityLabel={t("playlist.create")}
      // FIXME: Temporary until we implement the new "Create Playlist" screen.
      onPress={() => openModal({ entity: "playlist", scope: "new" })}
      className="bg-red"
    >
      <Add color={Colors.neutral100} />
    </IconButton>
  );
}
//#endregion
