import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Add } from "~/resources/icons/Add";
import { usePlaylists } from "~/queries/playlist";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { PlaylistsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";
import { FilledIconButton } from "~/components/Form/Button/Icon";

type PlaylistData = ExtractQueryData<typeof usePlaylists>[number];

export default function Playlists() {
  const { t } = useTranslation();
  const { isPending, data } = usePlaylists();

  const sortedData = useViewOrder("playlist", data);
  const formatData = useCallback(
    (item: PlaylistData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork,
    }),
    [t],
  );
  const presets = useViewLayout("playlist", sortedData, formatData);

  return (
    <NScrollListLayout
      titleKey="term.playlists"
      OptionsSheet={PlaylistsViewOptionsSheet}
      Actions={<PlaylistActions />}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noPlaylists"
        />
      }
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
    <FilledIconButton
      Icon={Add}
      accessibilityLabel={t("feat.playlist.extra.create")}
      onPress={() => navigation.navigate("CreatePlaylist")}
      className="bg-primary active:bg-primaryDim"
      size="sm"
      _iconColor="onPrimary"
    />
  );
}
//#endregion
