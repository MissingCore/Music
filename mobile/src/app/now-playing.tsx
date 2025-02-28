import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useProgress } from "react-native-track-player";

import { Favorite } from "~/icons/Favorite";
import { LibraryMusic } from "~/icons/LibraryMusic";
import { MoreVert } from "~/icons/MoreVert";
import { VolumeMute } from "~/icons/VolumeMute";
import { VolumeUp } from "~/icons/VolumeUp";
import { useFavoriteTrack, useTrack } from "~/queries/track";
import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useSeekStore } from "~/screens/NowPlaying/SeekService";
import { NowPlayingArtwork } from "~/screens/NowPlaying/Artwork";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { mutateGuard } from "~/lib/react-query";
import { formatSeconds } from "~/utils/number";
import { Marquee } from "~/components/Containment/Marquee";
import { SafeContainer } from "~/components/Containment/SafeContainer";
import { IconButton } from "~/components/Form/Button";
import { Slider } from "~/components/Form/Slider";
import { Back } from "~/components/Transition/Back";
import { StyledText } from "~/components/Typography/StyledText";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";

/** Screen for `/now-playing` route. */
export default function NowPlayingScreen() {
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
                SheetManager.show("TrackSheet", { payload: { id: track.id } })
              }
            >
              <MoreVert />
            </IconButton>
          ),
        }}
      />
      <SafeContainer additionalTopOffset={56} className="flex-1">
        <NowPlayingArtwork artwork={track.artwork} />
        <View className="gap-2 p-4">
          <Metadata name={track.name} artistName={track.artistName} />
          <SeekBar duration={track.duration} />
          <PlaybackControls />
          <VolumeSlider />
          <BottomAppBar trackId={track.id} />
        </View>
      </SafeContainer>
    </>
  );
}

//#region Metadata
/** Renders the name & artist of the current playing track. */
function Metadata(props: { name: string; artistName: string | null }) {
  return (
    <View className="gap-0.5 pt-4">
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
  const { position } = useProgress(200);
  const sliderPos = useSeekStore((state) => state.sliderPos);
  const setSliderPos = useSeekStore((state) => state.setSliderPos);

  const displayedPos = sliderPos ?? position;
  const clampedPos = displayedPos > duration ? duration : displayedPos;

  return (
    <View>
      <Slider
        value={clampedPos}
        max={duration}
        onChange={(newPos) => setSliderPos(newPos)}
        onComplete={async (newPos) => {
          await MusicControls.seekTo(newPos);
          // Helps prevents "rubberbanding".
          setTimeout(() => setSliderPos(null), 250);
        }}
        thumbSize={16}
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
    <View className="flex-row items-center justify-center gap-2 py-2">
      <ShuffleButton />
      <PreviousButton />
      <PlayToggleButton className="rounded-full px-6" />
      <NextButton />
      <RepeatButton />
    </View>
  );
}
//#endregion

//#region Volume Slider
/**
 * Allow us to adjust the internal volume of the media played
 * (different from device volume).
 */
function VolumeSlider() {
  const savedVolume = useUserPreferencesStore((state) => state.volume);
  return (
    <View className="flex-row items-center gap-2">
      <VolumeMute />
      <View className="grow">
        <Slider
          value={savedVolume}
          max={1}
          onChange={setVolume}
          thumbSize={12}
        />
      </View>
      <VolumeUp />
    </View>
  );
}

const setVolume = (newVolume: number) =>
  userPreferencesStore.setState({ volume: newVolume });
//#endregion

//#region Bottom App Bar
/** Actions rendered on the bottom of the screen. */
function BottomAppBar({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const { data } = useTrack(trackId); // Since we don't revalidate the Zustand store.
  const favoriteTrack = useFavoriteTrack(trackId);

  const isFav = favoriteTrack.isPending
    ? !data?.isFavorite
    : (data?.isFavorite ?? false);

  return (
    <View className="flex-row items-center justify-end gap-2 pt-2">
      <IconButton
        kind="ripple"
        accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
        onPress={() => mutateGuard(favoriteTrack, !data?.isFavorite)}
        rippleRadius={24}
        className="p-2"
      >
        <Favorite size={32} filled={isFav} />
      </IconButton>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("term.upcoming")}
        onPress={() => SheetManager.show("TrackUpcomingSheet")}
        rippleRadius={24}
        className="p-2"
      >
        <LibraryMusic size={32} />
      </IconButton>
    </View>
  );
}
//#endregion
