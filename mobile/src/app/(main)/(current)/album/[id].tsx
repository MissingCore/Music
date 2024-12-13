import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Favorite } from "@/icons";
import { useAlbumForScreen, useFavoriteAlbum } from "@/queries/album";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { mutateGuard } from "@/lib/react-query";
import { IconButton } from "@/components/Form";
import { StyledText } from "@/components/Typography";
import { TrackList } from "@/modules/media/components";

/** Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { id: _albumId } = useLocalSearchParams<{ id: string }>();
  const albumId = _albumId!;
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <StyledText preset="dimOnCanvas" className="text-base">
          Error: Album not found
        </StyledText>
      </View>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "album", id: albumId } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              kind="ripple"
              // FIXME: Temporary accessibility label.
              accessibilityLabel={isToggled ? "Unfavorite" : "Favorite"}
              onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
            >
              <Favorite filled={isToggled} />
            </IconButton>
          ),
        }}
      />
      <CurrentListLayout
        title={data.name}
        artist={data.artistName}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <TrackList data={data.tracks} trackSource={trackSource} />
      </CurrentListLayout>
    </>
  );
}
