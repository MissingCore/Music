import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";

import type { Album } from "~/db/schema";

import { useArtistForScreen } from "~/queries/artist";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useGetColumn } from "~/hooks/useGetColumn";
import { CurrentListLayout } from "~/layouts/CurrentList";

import { OnRTL } from "~/lib/react";
import { FlashList } from "~/components/Defaults";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "~/components/Transition/Placeholder";
import { TEm } from "~/components/Typography/StyledText";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { Track } from "~/modules/media/components/Track";

type ArtistAlbum = Omit<Album, "releaseYear"> & { releaseYear: string | null };

export default function ArtistScreen() {
  const { t } = useTranslation();
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
      <FlashList
        estimatedItemSize={56} // 48px Height + 8px Margin Top
        data={data.tracks}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <Track
            {...item}
            trackSource={trackSource}
            className={index > 0 ? "mt-2" : undefined}
          />
        )}
        ListHeaderComponent={<ArtistAlbums albums={data.albums} />}
        ListEmptyComponent={
          <ContentPlaceholder
            errMsg={t("feat.hiddenTracks.extra.hasHiddenTracks", {
              name: t("term.artist"),
            })}
          />
        }
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
function ArtistAlbums({ albums }: { albums: ArtistAlbum[] | null }) {
  const { width } = useGetColumn({
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });

  if (!albums) return null;

  return (
    <>
      <TEm dim textKey="term.albums" className="mb-2" />
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
            description={item.releaseYear || "————"}
            className={index > 0 ? OnRTL.decide("mr-3", "ml-3") : undefined}
          />
        )}
        className="-mx-4"
        contentContainerClassName="px-4"
        disableAutoLayout={I18nManager.isRTL}
      />
      <TEm dim textKey="term.tracks" className="mb-2 mt-4" />
    </>
  );
}
