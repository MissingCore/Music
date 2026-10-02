// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAlbumForScreen, useFavoriteAlbum } from "~/data/album/queries";

import * as MediaListLayout from "~/navigation/layouts/MediaListLayout";
import { AlbumArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import type { MenuAction } from "~/navigation/components/CurrentListMenu";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { isNumber } from "~/utils/validation";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Text } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { SequenceNumber } from "~/components/next/blocks/sequence-number";
import { TrackItem } from "~/components/next/composed/track-item";

type Props = StaticScreenProps<{ id: string }>;

export default function Album({
  route: {
    params: { id: albumId },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);
  const artworkSheetRef = useSheetRef();

  const trackSource = useMemo(
    () => ({ type: "album", id: albumId }) as const,
    [albumId],
  );

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        icon: "edit",
        labelKey: "form.edit",
        onPress: () => navigation.navigate("ModifyAlbum", { id: albumId }),
      },
    ],
    [navigation, albumId],
  );

  const formattedData = useMemo(() => {
    if (!data?.tracks) return [];

    // Skip rendering disc number if the album has an assigned disc, but it's just `Disc 1`.
    const skipDiscs =
      data.tracks[0]?.disc === 1 && data.tracks.at(-1)?.disc === 1;

    const foundDisc = new Set<number>();
    const sectionListTracks = [];
    for (const track of data.tracks) {
      if (track.disc !== null && !foundDisc.has(track.disc)) {
        foundDisc.add(track.disc);
        if (!skipDiscs) sectionListTracks.push(track.disc);
      }
      sectionListTracks.push(track);
    }

    return sectionListTracks;
  }, [data?.tracks]);

  if (isPending || error) {
    return <MediaListLayout.Skeleton pending={isPending} />;
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <AlbumArtworkSheet ref={artworkSheetRef} id={albumId} />

      <MediaListLayout.Provider
        imageSource={data.imageSource}
        listSource={trackSource}
      >
        <MediaListLayout.Header
          title={data.name}
          artists={data.artists}
          metadata={data.metadata}
          Actions={
            <View className="flex-row gap-1">
              <IconButton
                icon={`favorite${isToggled ? "-filled" : ""}`}
                accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
                onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
              />
              <CurrentListMenu
                actions={menuActions}
                name={data.name}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
              />
            </View>
          }
        />
        <MediaListLayout.List
          data={formattedData}
          keyExtractor={(item) => (isNumber(item) ? `${item}` : item.id)}
          renderItem={({ item, index }) =>
            isNumber(item) ? (
              <Text
                bold
                size="xs"
                className={cn("mx-0.75 mb-1.5", { "mt-1.5": index > 0 })}
              >
                {t("term.disc", { count: item })}
              </Text>
            ) : (
              <TrackItem
                {...item}
                Leading={<SequenceNumber value={item.track ?? "—"} />}
              />
            )
          }
        />
      </MediaListLayout.Provider>
    </>
  );
}
