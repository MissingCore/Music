import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { useFavoriteTracks } from "@/features/data/getFavoriteTracks";
import { modalConfigAtom } from "@/features/modal/store";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";
import { usePlaylist } from "@/features/playlist/api/getPlaylist";

import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const openModal = useSetAtom(modalConfigAtom);

  const isFavoriteTracks = useMemo(
    () => id === SpecialPlaylists.favorites,
    [id],
  );

  useEffect(() => {
    if (isFavoriteTracks) return;

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => openModal({ type: "playlist", ref: id })}>
          <EllipsisVertical size={24} />
        </Pressable>
      ),
    });
  }, [navigation, openModal, isFavoriteTracks, id]);

  if (isFavoriteTracks) {
    return <PlaylistListContent queryHook={useFavoriteTracks} />;
  }
  return (
    <PlaylistListContent id={id} queryHook={usePlaylist} origin="playlist" />
  );
}

type PlaylistContent = {
  origin?: React.ComponentProps<typeof TrackCard>["origin"];
} & (
  | { id: string; queryHook: typeof usePlaylist }
  | { id?: never; queryHook: typeof useFavoriteTracks }
);

/** @description Basic structure of what we want to render on page. */
function PlaylistListContent({ id, queryHook, origin }: PlaylistContent) {
  const { isPending, error, data } = queryHook(id ? id : undefined);

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
  const trackSrc = {
    type: "playlist",
    name: data.name,
    ref: data.name,
  } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaListHeader
        source={data.coverSrc}
        title={data.name}
        metadata={data.metadata}
        trackSource={trackSrc}
      />
      <MediaList
        data={data.tracks}
        renderItem={({
          item: { id, name, coverSrc, duration, artistName },
        }) => (
          <TrackCard
            {...{ id, trackSrc, coverSrc, duration }}
            textContent={[name, artistName]}
            origin={origin}
          />
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
