import type { StaticScreenProps } from "@react-navigation/native";

import { useGenreForScreen } from "~/data/genre/queries";

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";
import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { GenreArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
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
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = useGenreForScreen(id);
  const artworkSheetRef = useSheetRef();

  const trackSource = { type: "genre", id } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  if (isPending || error) {
    return (
      <SafeContainer additionalTopOffset={56}>
        <PagePlaceholder isPending={isPending} />
      </SafeContainer>
    );
  }

  return (
    <>
      <GenreArtworkSheet ref={artworkSheetRef} id={id} />

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
            />
          ),
        }}
        listSource={trackSource}
        imageSource={data.imageSource}
        // FlatList Props
        {...presets}
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
    </>
  );
}
