import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";

import { MoreVert } from "@/icons";
import { useFavoriteTracksForScreen } from "@/queries/favorite";
import { usePlaylistForScreen } from "@/queries/playlist";
import { MediaListHeader } from "@/layouts/CurrentList";

import { IconButton } from "@/components/Form";
import { StyledText } from "@/components/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import { TrackList } from "@/modules/media/components";
import type { MediaList } from "@/modules/media/types";

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const id = _id!;

  const isFavoriteTracks = useMemo(
    () => id === ReservedPlaylists.favorites,
    [id],
  );

  if (isFavoriteTracks) {
    return <PlaylistListContent queryHook={useFavoriteTracksForScreen} />;
  }
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel="View playlist settings."
              onPress={() => console.log("Configuring playlist...")}
            >
              <MoreVert />
            </IconButton>
          ),
        }}
      />
      <PlaylistListContent
        id={id}
        queryHook={usePlaylistForScreen}
        origin="playlist"
      />
    </>
  );
}

type PlaylistContent = {
  origin?: MediaList;
} & (
  | { id: string; queryHook: typeof usePlaylistForScreen }
  | { id?: never; queryHook: typeof useFavoriteTracksForScreen }
);

/** Basic structure of what we want to render on page. */
function PlaylistListContent({ id, queryHook, origin }: PlaylistContent) {
  const { isPending, error, data } = queryHook(id ?? "");

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <StyledText preset="dimOnCanvas" className="text-base">
          Error: Playlist not found
        </StyledText>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = { type: "playlist", id: data.name } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaListHeader
        // @ts-expect-error Technically fine as this is used for playlists.
        source={data.imageSource}
        title={data.name}
        metadata={data.metadata}
        trackSource={trackSource}
      />
      <TrackList
        data={data.tracks}
        trackSource={trackSource}
        // ListEmptyComponent={
        //   <Description>
        //     {id ? "No tracks in playlist." : "No favorited tracks."}
        //   </Description>
        // }
      />
    </View>
  );
}
