import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Favorite, LibraryMusic, MoreVert } from "@/icons";
import { useFavoriteTrack, useTrackExcerpt } from "@/queries/track";
import { useMusicStore } from "@/modules/media/services/Music";

import { mutateGuard } from "@/lib/react-query";
import { Back } from "@/components/new/Back";
import { Marquee } from "@/components/new/Containment";
import { IconButton } from "@/components/new/Form";
import { StyledText } from "@/components/new/Typography";
import {
  MediaImage,
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  SeekBar,
  ShuffleButton,
} from "@/modules/media/components";

/** Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const track = useMusicStore((state) => state.activeTrack);
  const listName = useMusicStore((state) => state.sourceName);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [infoHeight, setInfoHeight] = useState<number | null>(null);

  const availableLength = useMemo(() => {
    if (pageHeight === null || infoHeight === null) return undefined;
    // Exclude the vertical padding on container.
    const usedHeight = pageHeight - infoHeight - 32;
    const maxWidth = width - 32;
    return usedHeight > maxWidth ? maxWidth : usedHeight;
  }, [width, pageHeight, infoHeight]);

  if (!track) return <Back />;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: listName,
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t("template.entrySeeMore", {
                name: track.name,
              })}
              onPress={() =>
                SheetManager.show("track-sheet", { payload: { id: track.id } })
              }
            >
              <MoreVert />
            </IconButton>
          ),
        }}
      />
      <View
        onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}
        className="flex-1 items-center px-4 pt-8"
      >
        {availableLength !== undefined && (
          <MediaImage
            type="track"
            source={track.artwork}
            size={availableLength}
          />
        )}

        <View
          onLayout={({ nativeEvent }) =>
            setInfoHeight(nativeEvent.layout.height)
          }
          className="mt-auto w-full items-center pb-4"
        >
          {/* `flex-direction: column` w/ `align-content: center` breaks `<Marquee />`. */}
          <View className="flex-row">
            <View className="gap-0.5">
              <Marquee center>
                <StyledText className="text-xl">{track.name}</StyledText>
              </Marquee>
              <Marquee center>
                <StyledText className="text-sm text-red">
                  {track.artistName}
                </StyledText>
              </Marquee>
            </View>
          </View>

          <SeekBar duration={track.duration} />

          <View className="flex-row items-center gap-2">
            <ShuffleButton />
            <PreviousButton />
            <PlayToggleButton className="rounded-full px-6" />
            <NextButton />
            <RepeatButton />
          </View>
          <BottomAppBar trackId={track.id} />
        </View>
      </View>
    </>
  );
}

/** Actions rendered on the bottom of the screen. */
function BottomAppBar({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const { data } = useTrackExcerpt(trackId); // Since we don't revalidate the Zustand store.
  const favoriteTrack = useFavoriteTrack(trackId);

  const isFav = favoriteTrack.isPending
    ? !data?.isFavorite
    : (data?.isFavorite ?? false);

  return (
    <View className="w-full flex-row items-center justify-end gap-2 pt-8">
      <IconButton
        kind="ripple"
        accessibilityLabel={t(`common.${isFav ? "unF" : "f"}avorite`)}
        disabled={favoriteTrack.isPending}
        onPress={() => mutateGuard(favoriteTrack, !data?.isFavorite)}
        rippleRadius={24}
        className="p-2"
      >
        <Favorite size={32} filled={isFav} />
      </IconButton>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("title.upcoming")}
        onPress={() => console.log("Viewing upcoming tracks...")}
        rippleRadius={24}
        className="p-2"
      >
        <LibraryMusic size={32} />
      </IconButton>
    </View>
  );
}
