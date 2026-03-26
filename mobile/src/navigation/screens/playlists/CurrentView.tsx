import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Edit } from "~/resources/icons/Edit";
import { Favorite } from "~/resources/icons/Favorite";
import { FileSave } from "~/resources/icons/FileSave";
import {
  useFavoritePlaylist,
  usePlaylistForScreen,
} from "~/data/playlist/queries";

import { useBottomActionsOffset } from "~/navigation/hooks/useBottomActions";
import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { PlaylistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ExportM3USheet } from "./sheets/ExportM3USheet";

import { mutateGuard } from "~/lib/react-query";
import { IconButton } from "~/components/Form/Button/Icon";
import type { MenuAction } from "~/components/Menu";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { useTrackListPreset } from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

export default function Playlist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const bottomOffset = useBottomActionsOffset(16);
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);
  const artworkSheetRef = useSheetRef();
  const exportSheetRef = useSheetRef();

  const trackSource = { type: "playlist", id } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        Icon: Edit,
        labelKey: "form.edit",
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

  if (isPending || error) {
    return (
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <PagePlaceholder isPending={isPending} />
      </SafeContainer>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  const listName =
    data.name === FavoritesPlaylistKey ? t("term.favoriteTracks") : data.name;

  return (
    <>
      <PlaylistArtworkSheet ref={artworkSheetRef} id={id} />
      <ExportM3USheet ref={exportSheetRef} id={id} />

      <CurrentListLayout
        // List Header Props
        listInfo={{
          title: listName,
          metadata: data.metadata,
          Actions: (
            <View className="flex-row gap-1">
              {id !== FavoritesPlaylistKey ? (
                <IconButton
                  Icon={Favorite}
                  accessibilityLabel={t(
                    `term.${isToggled ? "unF" : "f"}avorite`,
                  )}
                  onPress={() =>
                    mutateGuard(favoritePlaylist, !data.isFavorite)
                  }
                  filled={isToggled}
                />
              ) : null}
              <CurrentListMenu
                actions={menuActions}
                name={listName}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
              />
            </View>
          ),
        }}
        listSource={trackSource}
        imageSource={data.imageSource}
        // FlatList Props
        {...presets}
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </>
  );
}
