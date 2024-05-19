import { Stack, useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { useFavoriteTracksForCurrentPage } from "@/api/favorites";
import { usePlaylistForCurrentPage } from "@/api/playlists/[id]";
import { modalAtom } from "@/features/modal/store";
import { SpecialPlaylists } from "@/features/playback/constants";

import { MediaPageHeader } from "@/components/media/MediaPageHeader";
import type { MediaList } from "@/components/media/types";
import { Description } from "@/components/ui/Text";
import { TrackList } from "@/features/track/components/TrackList";

/** @description Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const openModal = useSetAtom(modalAtom);

  const isFavoriteTracks = useMemo(
    () => id === SpecialPlaylists.favorites,
    [id],
  );

  if (isFavoriteTracks) {
    return <PlaylistListContent queryHook={useFavoriteTracksForCurrentPage} />;
  }
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() =>
                openModal({ entity: "playlist", scope: "view", id })
              }
            >
              <EllipsisVertical size={24} />
            </Pressable>
          ),
        }}
      />
      <PlaylistListContent
        id={id}
        queryHook={usePlaylistForCurrentPage}
        origin="playlist"
      />
    </>
  );
}

type PlaylistContent = {
  origin?: MediaList;
} & (
  | { id: string; queryHook: typeof usePlaylistForCurrentPage }
  | { id?: never; queryHook: typeof useFavoriteTracksForCurrentPage }
);

/** @description Basic structure of what we want to render on page. */
function PlaylistListContent({ id, queryHook, origin }: PlaylistContent) {
  const { isPending, error, data } = queryHook(id ?? "");

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description className="text-accent50">
          Error: Playlist not found
        </Description>
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
      <MediaPageHeader
        source={data.imageSource}
        title={data.name}
        metadata={data.metadata}
        trackSource={trackSource}
      />
      <TrackList
        data={data.tracks}
        config={{ source: trackSource, origin }}
        ListEmptyComponent={
          <Description>
            {id ? "No tracks in playlist." : "No favorited tracks."}
          </Description>
        }
      />
    </View>
  );
}
