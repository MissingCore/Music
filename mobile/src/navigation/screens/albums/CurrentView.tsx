// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAlbumForScreen, useFavoriteAlbum } from "~/data/album/queries";
import { TABLET_SIDEBAR_WIDTH_RATIO } from "~/hooks/useAlternativeLayout";
import { useListLayoutConfig } from "~/hooks/useLayoutConfigs";

import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { AlbumArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { isNumber } from "~/utils/validation";
import { IconButton } from "~/components/Form/Button/Icon";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Em, StyledText } from "~/components/Typography/StyledText";
import {
  Track,
  useTrackListPlayingIndication,
} from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

const ColumnLayoutConfig = { percentDeduction: TABLET_SIDEBAR_WIDTH_RATIO };

export default function Album({
  route: {
    params: { id: albumId },
  },
}: Props) {
  const { t } = useTranslation();
  const listLayout = useListLayoutConfig(ColumnLayoutConfig);
  const bottomOffset = useBottomActionsOffset(16);
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);
  const artworkSheetRef = useSheetRef();

  const trackSource = { type: "album", id: albumId } as const;
  const listData = useTrackListPlayingIndication(trackSource, data?.tracks);

  const formattedData = useMemo(() => {
    if (!listData) return [];

    // Skip rendering disc number if the album has an assigned disc, but it's just `Disc 1`.
    const skipDiscs = listData[0]?.disc === 1 && listData.at(-1)?.disc === 1;

    const foundDisc = new Set<number>();
    const sectionListTracks = [];
    for (const track of listData) {
      if (track.disc !== null && !foundDisc.has(track.disc)) {
        foundDisc.add(track.disc);
        if (!skipDiscs) sectionListTracks.push(track.disc);
      }
      sectionListTracks.push(track);
    }

    return sectionListTracks;
  }, [listData]);

  if (isPending || error) {
    return (
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <PagePlaceholder isPending={isPending} />
      </SafeContainer>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <AlbumArtworkSheet ref={artworkSheetRef} id={albumId} />

      <CurrentListLayout
        // List Header Props
        listInfo={{
          title: data.name,
          artists: data.artists,
          metadata: data.metadata,
          Actions: (
            <View className="flex-row gap-1">
              <IconButton
                icon={`favorite${isToggled ? "-filled" : ""}`}
                accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
                onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
              />
              <CurrentListMenu
                name={data.name}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
              />
            </View>
          ),
        }}
        listSource={trackSource}
        imageSource={data.imageSource}
        // FlatList Props
        numColumns={listLayout.count}
        data={formattedData}
        keyExtractor={(item) => (isNumber(item) ? `${item}` : item.id)}
        renderItem={({ item, index }) =>
          isNumber(item) ? (
            <Em className={cn("mx-1 mb-2", { "mt-2": index > 0 })}>
              {t("term.disc", { count: item })}
            </Em>
          ) : (
            <Track
              {...item}
              trackSource={trackSource}
              LeftElement={<TrackNumber track={item.track} />}
              className="mx-1 mb-2"
            />
          )
        }
        className="-mx-1 -mb-2"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </>
  );
}

/** Special track number next to the track content. */
function TrackNumber({ track }: { track: number | null }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{track !== null ? track : "—"}</StyledText>
    </View>
  );
}
