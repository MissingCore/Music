import { Slider } from "@miblanchard/react-native-slider";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useProgress } from "react-native-track-player";

import { Favorite, LibraryMusic, MoreVert } from "@/icons";
import { useFavoriteTrack, useTrackExcerpt } from "@/queries/track";
import { useTheme } from "@/hooks/useTheme";
import { useMusicStore } from "@/modules/media/services/Music";
import { MusicControls } from "@/modules/media/services/Playback";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { formatSeconds } from "@/utils/number";
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
  ShuffleButton,
} from "@/modules/media/components";

/** Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const { t } = useTranslation();
  const track = useMusicStore((state) => state.activeTrack);
  const listName = useMusicStore((state) => state.sourceName);

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
      <Artwork artwork={track.artwork} />
      <View className="gap-4 px-6 py-4">
        <Metadata name={track.name} artistName={track.artistName} />
        <SeekBar duration={track.duration} />
        <PlaybackControls />
        <BottomAppBar trackId={track.id} />
      </View>
    </>
  );
}

//#region Artwork
/** Renders the artwork of the current playing track. */
function Artwork(props: { artwork: string | null }) {
  const { width } = useWindowDimensions();
  const [areaHeight, setAreaHeight] = useState<number | null>(null);

  /* Get the height for the artwork that maximizes the space. */
  const maxImageHeight = useMemo(() => {
    if (areaHeight === null) return undefined;
    // Exclude the padding around the image depending on which measurement is used.
    return (areaHeight > width ? width : areaHeight) - 32;
  }, [areaHeight, width]);

  return (
    <View
      onLayout={({ nativeEvent }) => setAreaHeight(nativeEvent.layout.height)}
      className="flex-1 items-center pt-8"
    >
      {maxImageHeight !== undefined && (
        <MediaImage type="track" source={props.artwork} size={maxImageHeight} />
      )}
    </View>
  );
}
//#endregion

//#region Metadata
/** Renders the name & artist of the current playing track. */
function Metadata(props: { name: string; artistName: string | null }) {
  return (
    <View className="gap-0.5">
      <Marquee center>
        <StyledText className="text-xl">{props.name}</StyledText>
      </Marquee>
      <Marquee center>
        <StyledText className="text-sm text-red">{props.artistName}</StyledText>
      </Marquee>
    </View>
  );
}
//#endregion

//#region Seek Bar
/** Allows us to change the current positon of the playing track. */
export function SeekBar({ duration }: { duration: number }) {
  const { onSurface } = useTheme();
  const { position } = useProgress(200);
  const [slidingTrackPos, setSlidingTrackPos] = useState<number | null>(null);

  const displayedPos = slidingTrackPos ?? position;
  const clampedPos = displayedPos > duration ? duration : displayedPos;

  return (
    <View className="w-full">
      <Slider
        value={clampedPos}
        minimumValue={0}
        maximumValue={duration}
        onSlidingComplete={async ([newPos]) => {
          await MusicControls.seekTo(newPos!);
          // Helps prevents "rubberbanding".
          setTimeout(() => setSlidingTrackPos(null), 250);
        }}
        onValueChange={([newPos]) => setSlidingTrackPos(newPos!)}
        minimumTrackTintColor={Colors.red}
        maximumTrackTintColor={onSurface}
        thumbTintColor={Colors.red}
        trackStyle={{ height: 8, borderRadius: 24 }}
      />

      <View className="flex-row justify-between">
        <StyledText className="text-sm">{formatSeconds(clampedPos)}</StyledText>
        <StyledText className="text-sm">{formatSeconds(duration)}</StyledText>
      </View>
    </View>
  );
}
//#endregion

//#region Playback Controls
/** Playback controls for the current track. */
function PlaybackControls() {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <ShuffleButton />
      <PreviousButton />
      <PlayToggleButton className="rounded-full px-6" />
      <NextButton />
      <RepeatButton />
    </View>
  );
}
//#endregion

//#region Bottom App Bar
/** Actions rendered on the bottom of the screen. */
function BottomAppBar({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const { data } = useTrackExcerpt(trackId); // Since we don't revalidate the Zustand store.
  const favoriteTrack = useFavoriteTrack(trackId);

  const isFav = favoriteTrack.isPending
    ? !data?.isFavorite
    : (data?.isFavorite ?? false);

  return (
    <View className="flex-row items-center justify-end gap-2 pt-4">
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
//#endregion
