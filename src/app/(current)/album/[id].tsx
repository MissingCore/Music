import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { useFormattedAlbum } from "@/features/album/api/getAlbum";

import Colors from "@/constants/Colors";
import { AnimatedCover } from "@/components/media/AnimatedCover";
import { MediaControl } from "@/components/media/MediaControls";
import { ActionButton } from "@/components/ui/ActionButton";
import { TextLine } from "@/components/ui/Text";
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
      {isPending && (
        <ActivityIndicator
          size="large"
          color={Colors.surface500}
          className="mx-auto mt-5"
        />
      )}
      {(!!error || !data) && (
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Album not found
        </Text>
      )}

      {data && (
        <>
          <View className="border-b border-b-surface50 px-1 pb-2">
            <AnimatedCover imgSrc={data.coverSrc} className="mb-2" />
            <TextLine className="font-geistMono text-lg text-foreground50">
              {data.name}
            </TextLine>
            <Link
              href={`/artist/${data.artist.id}`}
              className="mb-1 font-geistMonoLight text-xs text-accent50"
            >
              {data.artist.name}
            </Link>
            <View className="flex-row items-center gap-8">
              <TextLine className="flex-1 font-geistMonoLight text-xs text-foreground100">
                {data.metadata.join(" • ")}
              </TextLine>
              <MediaControl />
            </View>
          </View>

          <FlatList
            initialNumToRender={15}
            data={data.tracks}
            keyExtractor={({ id }) => id}
            renderItem={({ item: { name, track, duration } }) => (
              <ActionButton
                onPress={() => console.log(`Now playing: ${name}`)}
                textContent={[name, track > 0 ? `Track ${track}` : "Track"]}
                asideContent={<TrackDuration duration={duration} />}
                icon={
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color={Colors.foreground100}
                  />
                }
                iconOnPress={() => console.log("View Track Options")}
                wrapperClassName="h-14 px-2"
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-2 px-1 pb-12 pt-4"
          />
        </>
      )}
    </View>
  );
}
