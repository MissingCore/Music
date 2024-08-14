import { Link, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Ionicons } from "@/resources/svgs/icons";
import { useAlbumForCurrentPage } from "@/api/albums/[id]";
import { useToggleFavorite } from "@/api/favorites/[id]";

import { mutateGuard } from "@/lib/react-query";
import { MediaScreenHeader } from "@/components/media/screen-header";
import { StyledPressable } from "@/components/ui/pressable";
import { Description } from "@/components/ui/text";
import { TrackList } from "@/features/track/components/track-list";

/** Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: _albumId } = useLocalSearchParams<{ id: string }>();
  const albumId = _albumId!;
  const { isPending, error, data } = useAlbumForCurrentPage(albumId);
  const toggleFavoriteFn = useToggleFavorite({ type: "album", id: albumId });

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description intent="error">Error: Album not found</Description>
      </View>
    );
  }

  // Add optimistic UI updates.
  const isToggled = toggleFavoriteFn.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "album", name: data.name, id: albumId } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <StyledPressable
              onPress={() => mutateGuard(toggleFavoriteFn, undefined)}
              forIcon
            >
              <Ionicons name={isToggled ? "heart" : "heart-outline"} />
            </StyledPressable>
          ),
        }}
      />
      <View className="w-full flex-1 px-4">
        <MediaScreenHeader
          source={data.imageSource}
          title={data.name}
          SubtitleComponent={
            <Link
              href={`/artist/${encodeURIComponent(data.artistName)}`}
              numberOfLines={1}
              className="self-start font-geistMonoLight text-xs text-accent50"
            >
              {data.artistName}
            </Link>
          }
          metadata={data.metadata}
          trackSource={trackSource}
        />
        <TrackList
          data={data.tracks}
          config={{ source: trackSource, origin: "album", hideImage: true }}
        />
      </View>
    </>
  );
}
