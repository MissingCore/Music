import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Edit } from "~/resources/icons/Edit";
import { Favorite } from "~/resources/icons/Favorite";
import { FileSave } from "~/resources/icons/FileSave";
import { useFavoritePlaylist, usePlaylistForScreen } from "~/queries/playlist";
import { useBottomActionsInset } from "../../../hooks/useBottomActions";
import { CurrentListLayout } from "../../../layouts/CurrentList";
import { ExportM3USheet } from "./ExportM3USheet";

import { mutateGuard } from "~/lib/react-query";
import { LegendList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import type { MenuAction } from "~/components/Menu";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { useTrackListPreset } from "~/modules/media/components/Track";
import { CurrentListMenu } from "../../../components/CurrentListMenu";
import { PagePlaceholder } from "../../../components/Placeholder";
import { ScreenOptions } from "../../../components/ScreenOptions";

type Props = StaticScreenProps<{ id: string }>;

export default function Playlist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);
  const exportSheetRef = useSheetRef();

  const trackSource = { type: "playlist", id } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        Icon: Edit,
        labelKey: "feat.playlist.extra.edit",
        onPress: () => navigation.navigate("ModifyPlaylist", { id }),
      },
      {
        Icon: FileSave,
        labelKey: "feat.playlist.extra.m3uExport",
        onPress: () => exportSheetRef.current?.present(),
      },
    ],
    [navigation, id, exportSheetRef],
  );

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <View className="flex-row gap-1">
            <IconButton
              Icon={Favorite}
              accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
              onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
              filled={isToggled}
            />
            <CurrentListMenu
              type="playlist"
              id={id}
              actions={menuActions}
              name={data.name}
              trackIds={data.tracks.map(({ id }) => id)}
            />
          </View>
        )}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <LegendList
          {...presets}
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        />
      </CurrentListLayout>
      <ExportM3USheet ref={exportSheetRef} id={id} />
    </>
  );
}
