import { useLocalSearchParams } from "expo-router";

import type { Album } from "~/db/schema";

import { useArtistForScreen } from "~/queries/artist";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useGetColumn } from "~/hooks/useGetColumn";
import { CurrentListLayout } from "~/layouts/CurrentList";

import { cn } from "~/lib/style";
import { isYearDefined } from "~/utils/number";
import { FlashList } from "~/components/Defaults";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { TEm } from "~/components/Typography/StyledText";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { Track } from "~/modules/media/components/Track";

/** Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { bottomInset } = useBottomActionsContext();
  const { id: artistName } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useArtistForScreen(artistName);

  if (isPending || error) return <PagePlaceholder {...{ isPending }} />;

  // Information about this track list.
  const trackSource = { type: "artist", id: artistName } as const;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <FlashList
        estimatedItemSize={56} // 48px Height + 8px Margin Top
        data={data.tracks}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <Track
            {...{ ...item, trackSource }}
            className={cn("mx-4", { "mt-2": index > 0 })}
          />
        )}
        ListHeaderComponent={<ArtistAlbums albums={data.albums} />}
        contentContainerClassName="pt-4"
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
      <TEm dim textKey="term.albums" className="mx-4 mb-2" />
      <FlashList
        estimatedItemSize={width + 12} // Column width + gap from padding left
        horizontal
        data={albums}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <MediaCard
            type="album"
            size={width}
            source={item.artwork}
            href={`/album/${item.id}`}
            title={item.name}
            description={`${isYearDefined(item.releaseYear) ? item.releaseYear : "————"}`}
            className={index > 0 ? "ml-3" : undefined}
          />
        )}
        contentContainerClassName="px-4"
      />
      <TEm dim textKey="term.tracks" className="m-4 mb-2" />
    </>
  );
}
