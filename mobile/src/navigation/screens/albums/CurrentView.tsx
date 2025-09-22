import type { StaticScreenProps } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Favorite } from "~/resources/icons/Favorite";
import { useAlbumForScreen, useFavoriteAlbum } from "~/queries/album";
import { useBottomActionsInset } from "../../hooks/useBottomActions";
import { CurrentListLayout } from "../../layouts/CurrentList";

import { mutateGuard } from "~/lib/react-query";
import { isNumber } from "~/utils/validation";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { Em, StyledText } from "~/components/Typography/StyledText";
import {
  Track,
  useTrackListPlayingIndication,
} from "~/modules/media/components/Track";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";
import { ScreenOptions } from "../../components/ScreenOptions";

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

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Add optimistic UI updates.
  const isToggled = favoriteAlbum.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <IconButton
            Icon={Favorite}
            accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
            onPress={() => mutateGuard(favoriteAlbum, !data.isFavorite)}
            filled={isToggled}
          />
        )}
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
          data={formattedData}
          keyExtractor={(item) => (isNumber(item) ? `${item}` : item.id)}
          getItemType={(item) => (isNumber(item) ? "label" : "row")}
          renderItem={({ item, index }) =>
            isNumber(item) ? (
              <Em dim className={index > 0 ? "mt-4" : undefined}>
                {t("term.disc", { count: item })}
              </Em>
            ) : (
              <Track
                {...item}
                trackSource={trackSource}
                LeftElement={<TrackNumber track={item.track} />}
                className={index > 0 ? "mt-2" : undefined}
              />
            )
          }
          ListEmptyComponent={
            <ContentPlaceholder
              errMsg={t("feat.hiddenTracks.extra.hasHiddenTracks", {
                name: t("term.album"),
              })}
            />
          }
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
