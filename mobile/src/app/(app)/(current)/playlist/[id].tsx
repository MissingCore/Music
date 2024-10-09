import { Stack, useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

import { EllipsisVertical } from "@/resources/icons/EllipsisVertical";
import { useFavoriteTracksForCurrentPage } from "@/api/favorites";
import { usePlaylistForCurrentPage } from "@/api/playlists/[id]";
import { mediaModalAtom } from "@/modals/categories/media/store";
import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";

import { MediaScreenHeader } from "@/components/media/screen-header";
import { StyledPressable } from "@/components/ui/pressable";
import { Description } from "@/components/ui/text";
import { TrackList } from "@/modules/media/components/Track";
import type { MediaList } from "@/modules/media/types";

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const id = _id!;
  const openModal = useSetAtom(mediaModalAtom);

  const isFavoriteTracks = useMemo(
    () => id === ReservedPlaylists.favorites,
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
            <StyledPressable
              accessibilityLabel="View playlist settings."
              onPress={() =>
                openModal({ entity: "playlist", scope: "view", id })
              }
              forIcon
            >
              <EllipsisVertical size={24} />
            </StyledPressable>
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

/** Basic structure of what we want to render on page. */
function PlaylistListContent({ id, queryHook, origin }: PlaylistContent) {
  const { isPending, error, data } = queryHook(id ?? "");

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description intent="error">Error: Playlist not found</Description>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = { type: "playlist", id: data.name } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaScreenHeader
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
