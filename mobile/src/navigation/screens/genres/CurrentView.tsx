// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useMemo } from "react";

import { useGenreDetails, useGenreTracks } from "~/data/genre/queries";

import * as MediaListLayout from "~/navigation/layouts/MediaListLayout";
import { GenreArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { SortSheet } from "~/navigation/sheets/SortSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TrackItem } from "~/components/next/composed/track-item";

type Props = StaticScreenProps<{ id: string }>;

export default function Genre({
  route: {
    params: { id },
  },
}: Props) {
  const genreDetailsQuery = useGenreDetails(id);
  const genreTracksQuery = useGenreTracks(id);
  const artworkSheetRef = useSheetRef();
  const tracksSortOptionsSheetRef = useSheetRef();

  const trackSource = useMemo(() => ({ type: "genre", id }) as const, [id]);

  if (genreDetailsQuery.isPending || genreDetailsQuery.error) {
    return <MediaListLayout.Skeleton pending={genreDetailsQuery.isPending} />;
  }

  return (
    <>
      <GenreArtworkSheet ref={artworkSheetRef} id={id} />
      <SortSheet ref={tracksSortOptionsSheetRef} screen="genreTracks" />

      <MediaListLayout.Provider
        imageSource={genreDetailsQuery.data.imageSource}
        listSource={trackSource}
      >
        <MediaListLayout.Header
          title={genreDetailsQuery.data.name}
          metadata={genreDetailsQuery.data.metadata}
          Actions={
            <CurrentListMenu
              name={genreDetailsQuery.data.name}
              trackIds={genreTracksQuery.data?.map(({ id }) => id) ?? []}
              presentArtworkSheet={() => artworkSheetRef.current?.present()}
              presentSortOptionsSheet={() =>
                tracksSortOptionsSheetRef.current?.present()
              }
            />
          }
        />
        <MediaListLayout.List
          data={genreTracksQuery.data}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => <TrackItem {...item} />}
        />
      </MediaListLayout.Provider>
    </>
  );
}
