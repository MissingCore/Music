// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { View } from "react-native";

import { useArtistDetails, useArtistTracks } from "~/data/artist/queries";
import type { ArtistAlbum } from "~/data/artist/types";
import { useHorizontalListLayoutConfig } from "~/hooks/useLayoutConfigs";

import * as MediaListLayout from "~/navigation/layouts/MediaListLayout";
import { ArtistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { SortSheet } from "~/navigation/sheets/SortSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { FlatList } from "~/components/Base/List";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TText } from "~/components/next/base/typography";
import { ImageCard } from "~/components/next/composed/image-card";
import { TrackItem } from "~/components/next/composed/track-item";

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const artistDetailsQuery = useArtistDetails(artistName);
  const artistTracksQuery = useArtistTracks(artistName);
  const artworkSheetRef = useSheetRef();
  const tracksSortOptionsSheetRef = useSheetRef();

  const trackSource = useMemo(
    () => ({ type: "artist", id: artistName }) as const,
    [artistName],
  );

  if (artistDetailsQuery.isPending || artistDetailsQuery.error) {
    return <MediaListLayout.Skeleton pending={artistDetailsQuery.isPending} />;
  }

  return (
    <>
      <ArtistArtworkSheet ref={artworkSheetRef} id={artistName} />
      <SortSheet ref={tracksSortOptionsSheetRef} screen="artistTracks" />

      <MediaListLayout.Provider
        imageSource={artistDetailsQuery.data.imageSource}
        listSource={trackSource}
      >
        <MediaListLayout.Header
          imageSource={artistDetailsQuery.data.imageSource}
          title={artistDetailsQuery.data.name}
          metadata={artistDetailsQuery.data.metadata}
          Actions={
            <CurrentListMenu
              name={artistDetailsQuery.data.name}
              trackIds={artistTracksQuery.data?.map(({ id }) => id) ?? []}
              presentArtworkSheet={() => artworkSheetRef.current?.present()}
              presentSortOptionsSheet={() =>
                tracksSortOptionsSheetRef.current?.present()
              }
            />
          }
        />
        <MediaListLayout.List
          data={artistTracksQuery.data}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => <TrackItem {...item} />}
          ListHeaderComponent={
            <ArtistAlbums albums={artistDetailsQuery.data.albums} />
          }
        />
      </MediaListLayout.Provider>
    </>
  );
}

/**
 * Display a list of the artist's albums. Renders a heading for the track
 * list only if the artist has albums.
 */
function ArtistAlbums({ albums }: { albums: ArtistAlbum[] | null }) {
  const navigation = useNavigation();
  const { width } = useHorizontalListLayoutConfig();

  if (!albums) return null;
  return (
    <View>
      <TText textKey="term.albums" bold size="xs" />
      <FlatList
        horizontal
        data={albums}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => (
          <ImageCard
            src={item.artwork}
            size={width}
            label={item.name}
            supporting={item.year}
            onPress={() =>
              navigation.navigate("Album", { id: item.id }, { pop: true })
            }
            spacing="none"
          />
        )}
        className="-mx-4"
        contentContainerClassName="gap-1.5 px-4 py-1.5"
      />
      <TText textKey="term.tracks" bold size="xs" className="mb-1.5" />
    </View>
  );
}
