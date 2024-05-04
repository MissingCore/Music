import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { useAlbumForCurrentPage } from "@/api/albums/[id]";
import { useToggleFavorite } from "@/api/favorites/[id]";
import { modalAtom } from "@/features/modal/store";
import { playAtom } from "@/features/playback/api/actions";

import Colors from "@/constants/Colors";
import { mutateGuard } from "@/lib/react-query";
import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { ActionButton } from "@/components/ui/ActionButton";
import { TrackDuration } from "@/features/track/components/TrackDuration";

/** @description Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: albumId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { isPending, error, data } = useAlbumForCurrentPage(albumId);
  const toggleFavoriteFn = useToggleFavorite({ type: "album", id: albumId });
  const playFn = useSetAtom(playAtom);
  const openModal = useSetAtom(modalAtom);

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
      <MediaListHeader
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
      <MediaList
        data={data.tracks}
        renderItem={({ item: { id, textContent, duration } }) => (
          <ActionButton
            onPress={() => playFn({ id, source: trackSource })}
            textContent={textContent}
            asideContent={<TrackDuration duration={duration} />}
            iconOnPress={() =>
              openModal({ type: "track", id, origin: "album" })
            }
          />
        )}
      />
    </View>
  );
}
