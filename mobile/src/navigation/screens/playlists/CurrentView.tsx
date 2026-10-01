// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  useFavoritePlaylist,
  usePlaylistForScreen,
} from "~/data/playlist/queries";

import * as MediaListLayout from "~/navigation/layouts/MediaListLayout";
import { PlaylistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import type { MenuAction } from "~/navigation/components/CurrentListMenu";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { ExportM3USheet } from "./sheets/ExportM3USheet";

import { mutateGuard } from "~/lib/react-query";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { IconButton } from "~/components/next/blocks/icon-button";
import { TrackItem } from "~/components/next/composed/track-item";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

type Props = StaticScreenProps<{ id: string }>;

export default function Playlist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);
  const artworkSheetRef = useSheetRef();
  const exportSheetRef = useSheetRef();

  const trackSource = useMemo(() => ({ type: "playlist", id }) as const, [id]);

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        icon: "edit",
        labelKey: "form.edit",
        onPress: () => navigation.navigate("ModifyPlaylist", { id }),
      },
      {
        icon: "file-save",
        labelKey: "feat.playlist.extra.m3uExport",
        onPress: () => exportSheetRef.current?.present(),
      },
    ],
    [navigation, id, exportSheetRef],
  );

  if (isPending || error)
    return <MediaListLayout.Skeleton pending={isPending} />;

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

      <MediaListLayout.Provider
        imageSource={data.imageSource}
        listSource={trackSource}
      >
        <MediaListLayout.Header
          imageSource={data.imageSource}
          title={listName}
          metadata={data.metadata}
          Actions={
            <View className="flex-row gap-1">
              {id !== FavoritesPlaylistKey ? (
                <IconButton
                  icon={`favorite${isToggled ? "-filled" : ""}`}
                  accessibilityLabel={t(
                    `term.${isToggled ? "unF" : "f"}avorite`,
                  )}
                  onPress={() =>
                    mutateGuard(favoritePlaylist, !data.isFavorite)
                  }
                />
              ) : null}
              <CurrentListMenu
                actions={menuActions}
                name={listName}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
              />
            </View>
          }
        />
        <MediaListLayout.Controls />
        <MediaListLayout.List
          data={data?.tracks}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => <TrackItem {...item} />}
        />
      </MediaListLayout.Provider>
    </>
  );
}
