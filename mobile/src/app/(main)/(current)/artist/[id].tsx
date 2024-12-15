import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { Album } from "@/db/schema";

import { useArtistForScreen } from "@/queries/artist";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { useGetColumn } from "@/hooks/useGetColumn";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { cn } from "@/lib/style";
import { Em, StyledText } from "@/components/Typography";
import { MediaCard, Track } from "@/modules/media/components";

/** Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id: artistName } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useArtistForScreen(artistName);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 p-4">
        <StyledText center>{t("response.noContent")}</StyledText>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = { type: "artist", id: artistName } as const;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={null}
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
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
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
  const { t } = useTranslation();
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });

  if (!albums) return null;

  return (
    <>
      <Em preset="dimOnCanvas" className="mx-4 mb-2">
        {t("common.albums")}
      </Em>
      <FlashList
        estimatedItemSize={width + 12} // Column width + gap from padding left
        horizontal
        data={albums}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <View className={index > 0 ? "pl-3" : undefined}>
            <MediaCard
              key={item.id}
              type="album"
              size={width}
              source={item.artwork}
              href={`/album/${item.id}`}
              title={item.name}
              subtitle={`${item.releaseYear ?? "————"}`}
            />
          </View>
        )}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
      />
      <Em preset="dimOnCanvas" className="m-4 mb-2">
        {t("common.tracks")}
      </Em>
    </>
  );
}
