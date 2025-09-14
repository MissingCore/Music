import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { usePlaylistsForCards } from "~/queries/playlist";
import { router } from "../../utils/router";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { Colors } from "~/constants/Styles";
import { Button } from "~/components/Form/Button";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Playlists() {
  const { isPending, data } = usePlaylistsForCards();
  const presets = useMediaCardListPreset({
    data,
    isPending,
    errMsgKey: "err.msg.noPlaylists",
  });

  return (
    <StickyActionListLayout
      titleKey="term.playlists"
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
  return (
    <View className="rounded-md bg-canvas">
      <Button
        accessibilityLabel={t("feat.playlist.extra.create")}
        onPress={() => router.navigate("/playlist/create")}
        className="bg-red p-3"
      >
        <Add color={Colors.neutral100} />
      </Button>
    </View>
  );
}
//#endregion
