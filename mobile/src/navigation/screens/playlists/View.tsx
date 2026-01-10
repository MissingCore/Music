import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { usePlaylistsForCards } from "~/queries/playlist";
import { StickyActionListLayout } from "../../layouts/StickyActionScroll";

import { FilledIconButton } from "~/components/Form/Button/Icon";
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
  const navigation = useNavigation();

  return (
    <View className="rounded-md bg-surface">
      <FilledIconButton
        Icon={Add}
        accessibilityLabel={t("feat.playlist.extra.create")}
        onPress={() => navigation.navigate("CreatePlaylist")}
        className="rounded-md bg-red"
        _iconColor="onPrimary"
      />
    </View>
  );
}
//#endregion
