import { useLocalSearchParams } from "expo-router";

import type { Album } from "~/db/schema";

import { useArtistForScreen } from "~/queries/artist";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useGetColumn } from "~/hooks/useGetColumn";
import { CurrentListLayout } from "~/layouts/CurrentList";

import { isYearDefined } from "~/utils/number";
import { LegendList } from "~/components/Defaults";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { TEm } from "~/components/Typography/StyledText";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { Track } from "~/modules/media/components/Track";

/** Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { bottomInset } = useBottomActionsContext();
  const { id: artistName } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useArtistForScreen(artistName);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Information about this track list.
  const trackSource = { type: "artist", id: artistName } as const;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <LegendList
        estimatedItemSize={48}
        data={data.tracks}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => <Track {...item} trackSource={trackSource} />}
        ListHeaderComponent={<ArtistAlbums albums={data.albums} />}
        columnWrapperStyle={{ rowGap: 8 }}
        contentContainerClassName="px-4 pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
    </CurrentListLayout>
  );
}

/**
 * Display a list of the artist's albums. Renders a heading for the track
 * list only if the artist has albums.
 */
function ArtistAlbums({ albums }: { albums: Album[] | null }) {
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });

  if (!albums) return null;

  return (
    <>
      <TEm dim textKey="term.albums" className="mb-2" />
      <LegendList
        estimatedItemSize={width}
        horizontal
        data={albums}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => (
          <MediaCard
            type="album"
            size={width}
            source={item.artwork}
            href={`/album/${item.id}`}
            title={item.name}
            description={`${isYearDefined(item.releaseYear) ? item.releaseYear : "————"}`}
          />
        )}
        columnWrapperStyle={{ columnGap: 12 }}
        style={{ height: width + 39 }}
        className="-mx-4"
        contentContainerClassName="px-4"
      />
      <TEm dim textKey="term.tracks" className="mb-2 mt-4" />
    </>
  );
}
