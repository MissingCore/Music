import type { StaticScreenProps } from "@react-navigation/native";

import { useGenreForScreen } from "~/data/genre/queries";

import { useBottomActionsOffset } from "~/navigation/hooks/useBottomActions";
import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { GenreArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { SortSheet } from "~/navigation/sheets/SortSheet";
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
  const { isPending, error, data } = useGenreForScreen(id);
  const artworkSheetRef = useSheetRef();
  const tracksSortOptionsSheetRef = useSheetRef();

  const trackSource = { type: "genre", id } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  return (
    <>
      <GenreArtworkSheet ref={artworkSheetRef} id={id} />
      <SortSheet ref={tracksSortOptionsSheetRef} screen="genreTracks" />

      {/* Note: Render via ternary as app will crash due to re-rendering the opened sheet when changing the sort order. */}
      {isPending || error ? (
        <SafeContainer additionalTopOffset={56} className="flex-1">
          <PagePlaceholder isPending={isPending} />
        </SafeContainer>
      ) : (
        <CurrentListLayout
          // List Header Props
          listInfo={{
            title: data.name,
            metadata: data.metadata,
            Actions: (
              <CurrentListMenu
                name={data.name}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
                presentSortOptionsSheet={() =>
                  tracksSortOptionsSheetRef.current?.present()
                }
              />
            ),
          }}
          listSource={trackSource}
          imageSource={data.imageSource}
          // FlatList Props
          {...presets}
          contentContainerStyle={{ paddingBottom: bottomOffset }}
        />
      )}
    </>
  );
}
