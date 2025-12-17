import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, View } from "react-native";

import type { TrackWithAlbum } from "~/db/schema";

import { Favorite } from "~/resources/icons/Favorite";
import { InstantMix } from "~/resources/icons/InstantMix";
import { KeyboardArrowDown } from "~/resources/icons/KeyboardArrowDown";
import { LibraryMusic } from "~/resources/icons/LibraryMusic";
import { MoreVert } from "~/resources/icons/MoreVert";
import { Timer } from "~/resources/icons/Timer";
import { useFavoriteTrack, useTrack } from "~/queries/track";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/services/SessionStore";
import { usePlayerProgress } from "../helpers/usePlayerProgress";
import { NowPlayingArtwork } from "../components/Artwork";
import { ProgressBar } from "../components/ProgressBar";
import { PlaybackOptionsSheet } from "./PlaybackOptionsSheet";
import { SleepTimerSheet } from "./SleepTimerSheet";
import { useSleepTimerStore } from "./SleepTimerSheet/store";

import { OnRTL } from "~/lib/react";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { formatSeconds } from "~/utils/number";
import { Marquee } from "~/components/Containment/Marquee";
import { SafeContainer } from "~/components/Containment/SafeContainer";
import { IconButton } from "~/components/Form/Button";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { Back } from "../../../components/Back";

export default function NowPlaying() {
  const track = usePlaybackStore((s) => s.activeTrack);
  if (!track) return <Back />;
  return (
    <SafeContainer additionalTopOffset={56} className="flex-1 gap-8">
      <NowPlayingArtwork artwork={track.artwork} />
      <View className="gap-6 px-4">
        <Metadata track={track} />
        <SeekBar duration={track.duration} id={track.id} uri={track.uri} />
        <PlaybackControls />
      </View>
      <BottomAppBar />
    </SafeContainer>
  );
}

//#region Metadata
/** Brief information and actions on the current playing track. */
function Metadata({ track }: { track: TrackWithAlbum }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <StyledText className="text-xl/[1.125]">{track.name}</StyledText>
        </Marquee>
        <MarqueeLink
          onPress={() =>
            navigation.popTo("Artist", { id: track.artistName ?? "" })
          }
          className="text-red"
        >
          {track.artistName}
        </MarqueeLink>
        <MarqueeLink
          onPress={() =>
            navigation.popTo("Album", { id: track.album?.id ?? "" })
          }
          dim
        >
          {track.album?.name}
        </MarqueeLink>
      </View>
      <View className="flex-row items-center gap-2">
        <FavoriteButton trackId={track.id} />
        <IconButton
          Icon={MoreVert}
          accessibilityLabel={t("template.entrySeeMore", { name: track.name })}
          onPress={() => presentTrackSheet(track.id)}
          large
        />
      </View>
      {/*
        "Spacer" to prevent layout shift when missing album or artist name.
        There needs to be some content within the text to have the line height
        take effect.
      */}
      <View
        aria-hidden
        pointerEvents="none"
        className="invisible -ml-4 w-0 gap-1"
      >
        <StyledText className="text-xl/[1.125]"> </StyledText>
        <StyledText className="text-sm/[1.125]"> </StyledText>
        <StyledText className="text-sm/[1.125]"> </StyledText>
      </View>
    </View>
  );
}

/** Quick action to favorite/unfavorite a track. */
function FavoriteButton(props: { trackId: string }) {
  const { t } = useTranslation();
  const { data } = useTrack(props.trackId); // Since we don't revalidate the Zustand store.
  const favoriteTrack = useFavoriteTrack(props.trackId);

  const isFav = favoriteTrack.isPending
    ? !data?.isFavorite
    : (data?.isFavorite ?? false);

  return (
    <IconButton
      Icon={Favorite}
      accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
      onPress={() => mutateGuard(favoriteTrack, !data?.isFavorite)}
      filled={isFav}
      large
    />
  );
}

function MarqueeLink({
  onPress,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof StyledText> & { onPress: VoidFunction }) {
  if (!children) return null;
  return (
    <Marquee>
      <Pressable onPress={onPress}>
        <StyledText className={cn("text-sm/[1.125]", className)} {...rest}>
          {children}
        </StyledText>
      </Pressable>
    </Marquee>
  );
}
//#endregion

//#region Seek Bar
/** Allows us to change the current positon of the playing track. */
function SeekBar({
  duration,
  id,
  uri,
}: {
  duration: number;
  id: string;
  uri: string;
}) {
  const { position, setPosition, seekToPosition } = usePlayerProgress();

  const clampedPos = position > duration ? duration : position;

  return (
    <View>
      <ProgressBar
        trackId={id}
        trackPath={uri}
        value={clampedPos}
        max={duration}
        onChange={setPosition}
        onComplete={seekToPosition}
        inverted={I18nManager.isRTL}
      />
      <View
        style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
        className="justify-between"
      >
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
    <View
      style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
      className="items-center justify-center gap-2"
    >
      <ShuffleButton />
      <PreviousButton />
      <PlayToggleButton />
      <NextButton />
      <RepeatButton />
    </View>
  );
}
//#endregion

//#region Bottom App Bar
/** Actions rendered on the bottom of the screen. */
function BottomAppBar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const playbackOptionsSheetRef = useSheetRef();
  const sleepTimerSheetRef = useSheetRef();
  const sleepTimerActive = useSleepTimerStore((s) => s.endAt) !== null;

  return (
    <>
      <PlaybackOptionsSheet sheetRef={playbackOptionsSheetRef} />
      <SleepTimerSheet sheetRef={sleepTimerSheetRef} />
      <View className="flex-row items-center justify-between gap-4 p-4">
        <BackButton />
        <View className="flex-row items-center gap-4">
          <View className="relative">
            <IconButton
              Icon={Timer}
              accessibilityLabel={t("feat.sleepTimer.title")}
              onPress={() => sleepTimerSheetRef.current?.present()}
              large
            />
            {sleepTimerActive && (
              <View className="absolute right-2 top-2 size-2 rounded-full bg-red" />
            )}
          </View>
          <IconButton
            Icon={InstantMix}
            accessibilityLabel={t("feat.playback.extra.options")}
            onPress={() => playbackOptionsSheetRef.current?.present()}
            large
          />
          <IconButton
            Icon={LibraryMusic}
            accessibilityLabel={t("term.upcoming")}
            onPress={() => navigation.navigate("Upcoming")}
            large
          />
        </View>
      </View>
    </>
  );
}

/**
 * Conditionally render the back button in the bottom app bar if we're
 * using the `Vinyl (Legacy)` design.
 */
function BackButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const usedDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  if (usedDesign !== "vinylOld") return <View />;
  return (
    <IconButton
      Icon={KeyboardArrowDown}
      accessibilityLabel={t("form.back")}
      onPress={() => navigation.goBack()}
      large
    />
  );
}
//#endregion
