import { Link, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Ionicons } from "@/resources/icons";
import { useAlbumForScreen, useFavoriteAlbum } from "@/queries/album";

import { mutateGuard } from "@/lib/react-query";
import { MediaScreenHeader } from "@/components/media/screen-header";
import { StyledPressable } from "@/components/ui/pressable";
import { Description } from "@/components/ui/text";
import { TrackList } from "@/modules/media/components";

/** Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: _albumId } = useLocalSearchParams<{ id: string }>();
  const albumId = _albumId!;
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description intent="error">Error: Album not found</Description>
      </View>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "album", id: albumId } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <StyledPressable
              onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
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
        <TrackList data={data.tracks} trackSource={trackSource} />
      </View>
    </>
  );
}
