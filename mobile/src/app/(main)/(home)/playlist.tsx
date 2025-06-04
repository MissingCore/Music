import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/icons/Add";
import { usePlaylistsForCards } from "~/queries/playlist";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { Colors } from "~/constants/Styles";
import { Button } from "~/components/Form/Button";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
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
