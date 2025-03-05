import type { Href } from "expo-router";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useProgress } from "react-native-track-player";

import type { TrackWithAlbum } from "~/db/schema";

import { Favorite } from "~/icons/Favorite";
import { InstantMix } from "~/icons/InstantMix";
import { LibraryMusic } from "~/icons/LibraryMusic";
import { MoreVert } from "~/icons/MoreVert";
import { useFavoriteTrack, useTrack } from "~/queries/track";
import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useSeekStore } from "~/screens/NowPlaying/SeekService";
import { NowPlayingArtwork } from "~/screens/NowPlaying/Artwork";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
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
  const track = useMusicStore((state) => state.activeTrack);
  const listName = useMusicStore((state) => state.sourceName);

  if (!track) return <Back />;

  return (
    <>
      <Stack.Screen options={{ headerTitle: listName }} />
      <SafeContainer additionalTopOffset={56} className="flex-1 gap-8">
        <NowPlayingArtwork artwork={track.artwork} />
        <View className="gap-6 px-4">
          <Metadata track={track} />
          <SeekBar duration={track.duration} />
          <PlaybackControls />
        </View>
        <BottomAppBar />
      </SafeContainer>
    </>
  );
}

//#region Metadata
/** Brief information and actions on the current playing track. */
function Metadata({ track }: { track: TrackWithAlbum }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <StyledText className="text-xl/[1.125]">{track.name}</StyledText>
        </Marquee>
        <MarqueeLink href={`/artist/${track.artistName}`} className="text-red">
          {track.artistName}
        </MarqueeLink>
        <MarqueeLink href={`/album/${track.album?.id}`} dim>
          {track.album?.name}
        </MarqueeLink>
      </View>
      <View className="flex-row items-center gap-2">
        <FavoriteButton trackId={track.id} />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("template.entrySeeMore", { name: track.name })}
          onPress={() =>
            SheetManager.show("TrackSheet", { payload: { id: track.id } })
          }
          rippleRadius={24}
          className="p-2"
        >
          <MoreVert size={32} />
        </IconButton>
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
      kind="ripple"
      accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
      onPress={() => mutateGuard(favoriteTrack, !data?.isFavorite)}
      rippleRadius={24}
      className="p-2"
    >
      <Favorite size={32} filled={isFav} />
    </IconButton>
  );
}

function MarqueeLink({
  href,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof StyledText> & { href: Href }) {
  if (!children) return null;
  return (
    <Marquee>
      <Pressable onPress={() => router.navigate(href)}>
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
export function SeekBar({ duration }: { duration: number }) {
  const { position } = useProgress(200);
  const sliderPos = useSeekStore((state) => state.sliderPos);
  const setSliderPos = useSeekStore((state) => state.setSliderPos);

  const displayedPos = sliderPos ?? position;
  const clampedPos = displayedPos > duration ? duration : displayedPos;

  return (
    <View className="gap-2">
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
function BottomAppBar() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-end gap-4 p-4">
      <IconButton
        kind="ripple"
        accessibilityLabel={t("feat.playback.extra.options")}
        onPress={() => SheetManager.show("PlaybackOptionsSheet")}
        rippleRadius={24}
        className="p-2"
      >
        <InstantMix size={32} />
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
