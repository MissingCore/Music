import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { getPlaylists } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { Add } from "@/resources/icons";
import { StickyActionListLayout } from "@/layouts/StickyActionLayout";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { playlistKeys } from "@/constants/QueryKeys";
import { Colors } from "@/constants/Styles";
import { Button } from "@/components/new/Form";
import { useMediaCardListPreset } from "@/modules/media/components";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = usePlaylistsForMediaCard();
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
    <Button
      preset="danger"
      accessibilityLabel={t("playlist.create")}
      // FIXME: Temporary until we implement the new "Create Playlist" screen.
      onPress={() => openModal({ entity: "playlist", scope: "new" })}
      icon
    >
      <Add color={Colors.neutral100} />
    </Button>
  );
}
//#endregion

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
