import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { useFavoriteTracksForCurrentPage } from "@/api/favorites";
import { usePlaylistForCurrentPage } from "@/api/playlists/[id]";
import { modalAtom } from "@/features/modal/store";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";

import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const openModal = useSetAtom(modalAtom);

  const isFavoriteTracks = useMemo(
    () => id === SpecialPlaylists.favorites,
    [id],
  );

  useEffect(() => {
    if (isFavoriteTracks) return;

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => openModal({ type: "playlist", id })}>
          <EllipsisVertical size={24} />
        </Pressable>
      ),
    });
  }, [navigation, openModal, isFavoriteTracks, id]);

  if (isFavoriteTracks) {
    return <PlaylistListContent queryHook={useFavoriteTracksForCurrentPage} />;
  }
  return (
    <PlaylistListContent
      id={id}
      queryHook={usePlaylistForCurrentPage}
      origin="playlist"
    />
  );
}

type PlaylistContent = {
  origin?: React.ComponentProps<typeof TrackCard>["origin"];
} & (
  | { id: string; queryHook: typeof usePlaylistForCurrentPage }
  | { id?: never; queryHook: typeof useFavoriteTracksForCurrentPage }
);

/** @description Basic structure of what we want to render on page. */
function PlaylistListContent({ id, queryHook, origin }: PlaylistContent) {
  const { isPending, error, data } = queryHook(id ?? "");

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (!!error || !data) {
    return (
      <View className="w-full flex-1 px-4">
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Playlist not found
        </Text>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = {
    type: "playlist",
    name: data.name,
    id: data.name,
  } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaListHeader
        source={data.imageSource}
        title={data.name}
        metadata={data.metadata}
        trackSource={trackSource}
      />
      <MediaList
        data={data.tracks}
        renderItem={({ item }) => (
          <TrackCard {...{ ...item, trackSource }} origin={origin} />
        )}
        ListEmptyComponent={
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            {id ? "No tracks in playlist." : "No favorited tracks."}
          </Text>
        }
      />
    </View>
  );
}
