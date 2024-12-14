import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Edit, Favorite } from "@/icons";
import { useFavoritePlaylist, usePlaylistForScreen } from "@/queries/playlist";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { IconButton } from "@/components/Form";
import { StyledText } from "@/components/Typography";
import { Track } from "@/modules/media/components";

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 p-4">
        <StyledText center>{t("response.noContent")}</StyledText>
      </View>
    );
  }

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
            <View className={cn("mx-4", { "mt-2": index > 0 })}>
              <Track {...item} trackSource={trackSource} />
            </View>
          )}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
          ListEmptyComponent={
            <StyledText center>{t("response.noTracks")}</StyledText>
          }
        />
      </CurrentListLayout>
    </>
  );
}
