import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { useFormattedAlbum } from "@/features/album/api/getAlbum";

import Colors from "@/constants/Colors";
import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Spinner } from "@/components/ui/Spinner";
import { TrackDuration } from "@/features/track/components/TrackDuration";

/** @description Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { isPending, error, data } = useFormattedAlbum(id as string);

  useEffect(() => {
    if (data?.isFavorite === undefined) return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => console.log("Add album to favorites.")}>
          <Ionicons
            name={data.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={Colors.foreground50}
          />
        </Pressable>
      ),
    });
  }, [navigation, data?.isFavorite]);

  return (
    <View className="w-full flex-1 px-4">
      {isPending && <Spinner className="mt-5" />}
      {(!!error || !data) && (
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Album not found
        </Text>
      )}

      {data && (
        <>
          <MediaListHeader
            imgSrc={data.coverSrc}
            title={data.name}
            subtitleComponent={
              <Link
                href={`/artist/${data.artist.id}`}
                numberOfLines={1}
                className="font-geistMonoLight text-xs text-accent50"
              >
                {data.artist.name}
              </Link>
            }
            metadata={data.metadata}
          />

          <MediaList
            data={data.tracks}
            renderItem={({ item: { name, track, duration } }) => (
              <ActionButton
                onPress={() => console.log(`Now playing: ${name}`)}
                textContent={[
                  name,
                  track > 0 ? `Track ${`${track}`.padStart(2, "0")}` : "Track",
                ]}
                asideContent={<TrackDuration duration={duration} />}
                iconOnPress={() => console.log("View Track Options")}
                wrapperClassName="h-14 px-2"
              />
            )}
          />
        </>
      )}
    </View>
  );
}
