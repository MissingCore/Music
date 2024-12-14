import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Favorite } from "@/icons";
import { useAlbumForScreen, useFavoriteAlbum } from "@/queries/album";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { IconButton } from "@/components/Form";
import { StyledText } from "@/components/Typography";
import { Track } from "@/modules/media/components";

/** Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id: albumId } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 p-4">
        <StyledText center>{t("response.noContent")}</StyledText>
      </View>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "album", id: albumId } as const;

  const discLocation: Record<number, number> = {};
  data.tracks.forEach(({ disc }, index) => {
    if (disc === null) return;
    if (!Object.hasOwn(discLocation, disc)) discLocation[disc] = index;
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t(`common.${isToggled ? "unF" : "f"}avorite`)}
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
        <FlashList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={data.tracks}
          keyExtractor={({ id }) => id}
          renderItem={({ item, index }) => (
            <View className={cn({ "mt-2": index > 0 })}>
              {item.disc !== null && discLocation[item.disc] === index ? (
                <StyledText preset="dimOnCanvas" bold className="my-2 text-xxs">
                  {t("common.disc", { count: item.disc }).toLocaleUpperCase()}
                </StyledText>
              ) : null}
              <Track
                {...item}
                LeftElement={<TrackNumber track={item.track} />}
                trackSource={trackSource}
              />
            </View>
          )}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-4"
          contentContainerStyle={{
            paddingBottom: bottomInset.onlyPlayer + 16,
          }}
        />
      </CurrentListLayout>
    </>
  );
}

/** Special track number next to the track content. */
function TrackNumber({ track }: { track: number | null }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{track !== null ? track : "—"}</StyledText>
    </View>
  );
}
