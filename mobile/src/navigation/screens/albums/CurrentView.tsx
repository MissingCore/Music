import type { StaticScreenProps } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Favorite } from "~/resources/icons/Favorite";
import { useAlbumForScreen, useFavoriteAlbum } from "~/queries/album";

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";
import { CurrentListLayout } from "~/navigation/layouts/CurrentListLayout";
import { AlbumArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { isNumber } from "~/utils/validation";
import { IconButton } from "~/components/Form/Button/Icon";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Em, StyledText } from "~/components/Typography/StyledText";
import {
  Track,
  useTrackListPlayingIndication,
} from "~/modules/media/components/Track";

type Props = StaticScreenProps<{ id: string }>;

export default function Album({
  route: {
    params: { id: albumId },
  },
}: Props) {
  const { t } = useTranslation();
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = useAlbumForScreen(albumId);
  const favoriteAlbum = useFavoriteAlbum(albumId);
  const artworkSheetRef = useSheetRef();

  const trackSource = { type: "album", id: albumId } as const;
  const listData = useTrackListPlayingIndication(trackSource, data?.tracks);

  const formattedData = useMemo(() => {
    if (!listData) return [];

    const foundDisc = new Set<number>();
    const sectionListTracks = [];
    for (const track of listData) {
      if (track.disc !== null && !foundDisc.has(track.disc)) {
        foundDisc.add(track.disc);
        sectionListTracks.push(track.disc);
      }
      sectionListTracks.push(track);
    }

    return sectionListTracks;
  }, [listData]);

  if (isPending || error) {
    return (
      <SafeContainer additionalTopOffset={56}>
        <PagePlaceholder isPending={isPending} />
      </SafeContainer>
    );
  }

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <AlbumArtworkSheet ref={artworkSheetRef} id={albumId} />

      <CurrentListLayout
        // List Header Props
        listInfo={{
          title: data.name,
          artists: data.artistNames,
          metadata: data.metadata,
          Actions: (
            <View className="flex-row gap-1">
              <IconButton
                Icon={Favorite}
                accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
                onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
                filled={isToggled}
                size="sm"
              />
              <CurrentListMenu
                name={data.name}
                trackIds={data.tracks.map(({ id }) => id)}
                presentArtworkSheet={() => artworkSheetRef.current?.present()}
              />
            </View>
          ),
        }}
        listSource={trackSource}
        imageSource={data.imageSource}
        // FlatList Props
        data={formattedData}
        keyExtractor={(item) => (isNumber(item) ? `${item}` : item.id)}
        renderItem={({ item, index }) =>
          isNumber(item) ? (
            <Em className={cn("mb-2", { "mt-2": index > 0 })}>
              {t("term.disc", { count: item })}
            </Em>
          ) : (
            <Track
              {...item}
              trackSource={trackSource}
              LeftElement={<TrackNumber track={item.track} />}
              className="mb-2"
            />
          )
        }
        className="-mb-2"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
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
