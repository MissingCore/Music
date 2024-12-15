import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Edit, Favorite, Remove } from "@/icons";
import { useFavoritePlaylist, usePlaylistForScreen } from "@/queries/playlist";
import { useRemoveFromPlaylist } from "@/queries/track";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { FlashList } from "@/components/Defaults";
import { IconButton } from "@/components/Form";
import { Swipeable } from "@/components/Swipeable";
import { PagePlaceholder } from "@/components/Transition";
import { Track } from "@/modules/media/components";
import type { PlayListSource } from "@/modules/media/types";

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);

  if (isPending || error) return <PagePlaceholder {...{ isPending }} />;

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "playlist", id: data.name } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View className="flex-row gap-1">
              <IconButton
                kind="ripple"
                accessibilityLabel={t(
                  `common.${isToggled ? "unF" : "f"}avorite`,
                )}
                onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
              >
                <Favorite filled={isToggled} />
              </IconButton>
              <IconButton
                kind="ripple"
                accessibilityLabel={t("playlist.edit")}
                onPress={() => console.log("Configuring playlist...")}
              >
                <Edit />
              </IconButton>
            </View>
          ),
        }}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <FlashList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={data.tracks}
          keyExtractor={({ id }) => id}
          renderItem={({ item, index }) => (
            <View className={index > 0 ? "mt-2" : undefined}>
              <PlaylistTrack
                playlistName={data.name}
                track={item}
                trackSource={trackSource}
              />
            </View>
          )}
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
          emptyMsgKey="response.noTracks"
        />
      </CurrentListLayout>
    </>
  );
}

/** Swipeable for track in playlist. */
function PlaylistTrack(props: {
  playlistName: string;
  track: Track.Content;
  trackSource: PlayListSource;
}) {
  const { t } = useTranslation();
  const removeTrack = useRemoveFromPlaylist(props.track.id);

  return (
    <Swipeable
      renderRightActions={() => (
        <IconButton
          accessibilityLabel={t("template.entryRemove", {
            name: props.track.title,
          })}
          onPress={() => mutateGuard(removeTrack, props.playlistName)}
          className="mr-4 bg-red"
        >
          <Remove color={Colors.neutral100} />
        </IconButton>
      )}
      childrenContainerClassName="px-4"
    >
      <Track {...props.track} trackSource={props.trackSource} />
    </Swipeable>
  );
}
