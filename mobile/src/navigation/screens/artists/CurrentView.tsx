// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { useArtistDetails, useArtistTracks } from "~/data/artist/queries";
import type { ArtistAlbum } from "~/data/artist/types";
import { ColumnPresets, useGetColumn } from "~/hooks/useGetColumn";

import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { ArtistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { SortSheet } from "~/navigation/sheets/SortSheet";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { FlatList } from "~/components/Base/List";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TEm } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/customization/theme/hooks";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { useTrackListPreset } from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const bottomOffset = useBottomActionsOffset(16);
  const artistDetailsQuery = useArtistDetails(artistName);
  const artistTracksQuery = useArtistTracks(artistName);
  const artworkSheetRef = useSheetRef();
  const tracksSortOptionsSheetRef = useSheetRef();

  const trackSource = { type: "artist", id: artistName } as const;
  const presets = useTrackListPreset({
    data: artistTracksQuery.data,
    trackSource,
  });

  if (artistDetailsQuery.isPending || artistDetailsQuery.error) {
    return (
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <PagePlaceholder isPending={artistDetailsQuery.isPending} />
      </SafeContainer>
    );
  }

  return (
    <>
      <ArtistArtworkSheet ref={artworkSheetRef} id={artistName} />
      <SortSheet ref={tracksSortOptionsSheetRef} screen="artistTracks" />

      <CurrentListLayout
        // List Header Props
        listInfo={{
          title: artistDetailsQuery.data.name,
          metadata: artistDetailsQuery.data.metadata,
          Actions: (
            <CurrentListMenu
              name={artistDetailsQuery.data.name}
              trackIds={artistTracksQuery.data?.map(({ id }) => id) ?? []}
              presentArtworkSheet={() => artworkSheetRef.current?.present()}
              presentSortOptionsSheet={() =>
                tracksSortOptionsSheetRef.current?.present()
              }
            />
          ),
        }}
        listSource={trackSource}
        imageSource={artistDetailsQuery.data.imageSource}
        SubHeader={<ArtistAlbums albums={artistDetailsQuery.data.albums} />}
        // FlatList Props
        {...presets}
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </>
  );
}

/**
 * Display a list of the artist's albums. Renders a heading for the track
 * list only if the artist has albums.
 */
function ArtistAlbums({ albums }: { albums: ArtistAlbum[] | null }) {
  const navigation = useNavigation();
  const { surface } = useTheme();
  const { width } = useGetColumn(ColumnPresets.horizontalList);

  if (!albums) return null;
  return (
    <>
      <TEm textKey="term.albums" className="mb-2" />
      <View className="relative -mx-4">
        <FlatList
          horizontal
          data={albums}
          keyExtractor={({ id }) => id}
          renderItem={({ item, index }) => (
            <MediaCard
              type="album"
              id={item.id}
              size={width}
              source={item.artwork}
              title={item.name}
              description={item.year}
              onPress={() =>
                navigation.navigate("Album", { id: item.id }, { pop: true })
              }
              className={index > 0 ? "ml-3" : undefined}
            />
          )}
          contentContainerClassName="px-4"
        />

        {/* Scroll Shadow */}
        <LinearGradient
          pointerEvents="none"
          colors={[`${surface}E6`, `${surface}00`]}
          {...ShadowProps}
          className="absolute h-full w-4 ltr:left-0 rtl:right-0"
        />
        <LinearGradient
          pointerEvents="none"
          colors={[`${surface}00`, `${surface}E6`]}
          {...ShadowProps}
          className="absolute h-full w-4 ltr:right-0 rtl:left-0"
        />
      </View>
      <TEm textKey="term.tracks" className="mt-4 mb-2" />
    </>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
