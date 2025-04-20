import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Favorite } from "~/icons/Favorite";
import { useAlbumForScreen, useFavoriteAlbum } from "~/queries/album";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { CurrentListLayout } from "~/layouts/CurrentList";

import { mutateGuard } from "~/lib/react-query";
import { LegendList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { Track } from "~/modules/media/components/Track";

/** Screen for `/album/[id]` route. */
export default function CurrentAlbumScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id: albumId } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

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
              accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
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
        <LegendList
          estimatedItemSize={48}
          data={data.tracks}
          keyExtractor={({ id }) => id}
          renderItem={({ item, index }) => (
            <>
              {item.disc !== null && discLocation[item.disc] === index ? (
                <Em dim className={index === 0 ? "mb-2" : "my-2"}>
                  {t("term.disc", { count: item.disc })}
                </Em>
              ) : null}
              <Track
                {...item}
                trackSource={trackSource}
                LeftElement={<TrackNumber track={item.track} />}
              />
            </>
          )}
          columnWrapperStyle={{ rowGap: 8 }}
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
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
