import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { useAlbumForCurrentPage } from "@/api/albums/[id]";
import { useToggleFavorite } from "@/api/favorites/[id]";

import Colors from "@/constants/Colors";
import { mutateGuard } from "@/lib/react-query";
import { MediaPageHeader } from "@/components/media/MediaPageHeader";
import { TrackList } from "@/features/track/components/TrackList";

/** @description Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: albumId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { isPending, error, data } = useAlbumForCurrentPage(albumId);
  const toggleFavoriteFn = useToggleFavorite({ type: "album", id: albumId });

  useEffect(() => {
    if (data?.isFavorite === undefined) return;
    // Add optimistic UI updates.
    const isToggled = toggleFavoriteFn.isPending
      ? !data.isFavorite
      : data.isFavorite;

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => mutateGuard(toggleFavoriteFn, undefined)}>
          <Ionicons
            name={isToggled ? "heart" : "heart-outline"}
            size={24}
            color={Colors.foreground50}
          />
        </Pressable>
      ),
    });
  }, [navigation, data?.isFavorite, toggleFavoriteFn]);

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

  // Information about this track list.
  const trackSource = { type: "album", name: data.name, id: albumId } as const;

  return (
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
  );
}
