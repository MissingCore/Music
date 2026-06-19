import type { StaticScreenProps } from "@react-navigation/native";

import { useGenreDetails, useGenreTracks } from "~/data/genre/queries";

import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { GenreArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { SortSheet } from "~/navigation/sheets/SortSheet";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { useTrackListPreset } from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

export default function Genre({
  route: {
    params: { id },
  },
}: Props) {
  const bottomOffset = useBottomActionsOffset(16);
  const genreDetailsQuery = useGenreDetails(id);
  const genreTracksQuery = useGenreTracks(id);
  const artworkSheetRef = useSheetRef();
  const tracksSortOptionsSheetRef = useSheetRef();

  const trackSource = { type: "genre", id } as const;
  const presets = useTrackListPreset({
    data: genreTracksQuery.data,
    trackSource,
  });

  if (genreDetailsQuery.isPending || genreDetailsQuery.error) {
    return (
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <PagePlaceholder isPending={genreDetailsQuery.isPending} />
      </SafeContainer>
    );
  }

  return (
    <>
      <GenreArtworkSheet ref={artworkSheetRef} id={id} />
      <SortSheet ref={tracksSortOptionsSheetRef} screen="genreTracks" />

      <CurrentListLayout
        // List Header Props
        listInfo={{
          title: genreDetailsQuery.data.name,
          metadata: genreDetailsQuery.data.metadata,
          Actions: (
            <CurrentListMenu
              name={genreDetailsQuery.data.name}
              trackIds={genreTracksQuery.data?.map(({ id }) => id) ?? []}
              presentArtworkSheet={() => artworkSheetRef.current?.present()}
              presentSortOptionsSheet={() =>
                tracksSortOptionsSheetRef.current?.present()
              }
            />
          ),
        }}
        listSource={trackSource}
        imageSource={genreDetailsQuery.data.imageSource}
        // FlatList Props
        {...presets}
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </>
  );
}
