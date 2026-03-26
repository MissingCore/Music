import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import { useArtistForScreen } from "~/data/artist/queries";
import type { ArtistAlbum } from "~/data/artist/types";
import { useGetColumn } from "~/hooks/useGetColumn";
import { usePreferenceStore } from "~/stores/Preference/store";

import { useBottomActionsOffset } from "~/navigation/hooks/useBottomActions";
import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { ArtistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { FlatList } from "~/components/Base/List";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TEm } from "~/components/Typography/StyledText";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { useTrackListPreset } from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const bottomOffset = useBottomActionsOffset(16);
  const { isPending, error, data } = useArtistForScreen(artistName);
  const artworkSheetRef = useSheetRef();

  const trackSource = { type: "artist", id: artistName } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  if (isPending || error) {
    return (
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <PagePlaceholder isPending={isPending} />
      </SafeContainer>
    );
  }

  return (
    <>
      <ArtistArtworkSheet ref={artworkSheetRef} id={artistName} />

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
        SubHeader={<ArtistAlbums albums={data.albums} />}
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
  const { width } = useGetColumn({
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  const estimatedListHeight = width + (primaryFont === "Inter" ? 42 : 39);

  if (!albums) return null;
  return (
    <>
      <TEm textKey="term.albums" className="mb-2" />
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
        style={{ minHeight: estimatedListHeight }}
        className="-mx-4"
        contentContainerClassName="px-4"
      />
      <TEm textKey="term.tracks" className="mt-4 mb-2" />
    </>
  );
}
