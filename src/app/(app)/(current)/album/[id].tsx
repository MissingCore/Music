import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useAlbumForCurrentPage } from "@/api/albums/[id]";
import { useToggleFavorite } from "@/api/favorites/[id]";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { MediaPageHeader } from "@/components/media/MediaPageHeader";
import { TrackList } from "@/features/track/components/TrackList";

/** @description Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: albumId } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useAlbumForCurrentPage(albumId);
  const toggleFavoriteFn = useToggleFavorite({ type: "album", id: albumId });

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (!!error || !data) {
    return (
      <View className="w-full flex-1 px-4">
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Album not found
        </Text>
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
            <Pressable onPress={() => mutateGuard(toggleFavoriteFn, undefined)}>
              <Ionicons
                name={isToggled ? "heart" : "heart-outline"}
                size={24}
                color={Colors.foreground50}
              />
            </Pressable>
          ),
        }}
      />
      <View className="w-full flex-1 px-4">
        <MediaPageHeader
          source={data.imageSource}
          title={data.name}
          SubtitleComponent={
            <Link
              href={`/artist/${data.artistName}`}
              numberOfLines={1}
              className="font-geistMonoLight text-xs text-accent50"
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
