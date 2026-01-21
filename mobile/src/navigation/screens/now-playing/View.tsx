import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { TrackWithRelations } from "~/db/schema";

import { Favorite } from "~/resources/icons/Favorite";
import { KeyboardArrowDown } from "~/resources/icons/KeyboardArrowDown";
import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { MoreVert } from "~/resources/icons/MoreVert";
import { Timer } from "~/resources/icons/Timer";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { useFavoriteTrack, useTrack } from "~/queries/track";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/services/SessionStore";
import { SeekbarContext } from "./helpers/Seekbar.context";
import { NowPlayingArtwork } from "./components/Artwork";
import { SeekBar } from "./components/SeekBar";
import { PlaybackOptionsSheet } from "./sheets/PlaybackOptionsSheet";
import { SleepTimerSheet } from "./sheets/SleepTimerSheet";
import { useSleepTimerStore } from "./sheets/SleepTimerSheet/store";

import { OnRTL } from "~/lib/react";
import { mutateGuard } from "~/lib/react-query";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { Back } from "../../components/Back";

export default function NowPlaying() {
  const track = usePlaybackStore((s) => s.activeTrack);
  if (!track) return <Back />;
  return (
    <SeekbarContext>
      <SafeContainer additionalTopOffset={56} className="flex-1 gap-8">
        <NowPlayingArtwork artwork={track.artwork} />
        <View className="gap-6 px-4">
          <Metadata track={track} />
          <SeekBar id={track.id} uri={track.uri} trackLength={track.duration} />
          <PlaybackControls />
        </View>
        <BottomAppBar trackId={track.id} />
      </SafeContainer>
    </SeekbarContext>
  );
}

//#region Metadata
function Metadata({ track }: { track: TrackWithRelations }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <StyledText className="text-xl/[1.125]">{track.name}</StyledText>
        </Marquee>
        <ArtistsLink
          artistNames={track.tracksToArtists.map((rel) => rel.artistName)}
          popScreen
          className="text-sm/[1.125]"
        />
        {track.album ? (
          <Marquee>
            <Pressable
              onPress={() => navigation.popTo("Album", { id: track.album!.id })}
            >
              <StyledText dim className="text-sm/[1.125]">
                {track.album.name}
              </StyledText>
            </Pressable>
          </Marquee>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1">
        <FavoriteButton trackId={track.id} />
        <IconButton
          Icon={MoreVert}
          accessibilityLabel={t("template.entrySeeMore", { name: track.name })}
          onPress={() => presentTrackSheet(track.id)}
          size="lg"
        />
      </View>
      {/*
        "Spacer" to prevent layout shift when missing album or artist name.
        There needs to be some content within the text to have the line height
        take effect.
      */}
      <View aria-hidden pointerEvents="none" className="-ml-4 w-0 gap-1">
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
      size="lg"
    />
  );
}
//#endregion

//#region Playback Controls
function PlaybackControls() {
  return (
    <View
      style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
      className="mx-auto w-full max-w-96 items-center justify-between gap-2"
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
function BottomAppBar({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sleepTimerSheetRef = useSheetRef();
  const playbackOptionsSheetRef = useSheetRef();

  return (
    <>
      <SleepTimerSheet ref={sleepTimerSheetRef} />
      <PlaybackOptionsSheet ref={playbackOptionsSheetRef} trackId={trackId} />

      <View className="flex-row items-center justify-between gap-4 p-4 pt-2">
        <BackButton />
        <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
          <SleepTimerButton
            present={() => sleepTimerSheetRef.current?.present()}
          />
          <IconButton
            Icon={ViewAgenda}
            accessibilityLabel={t("term.upcoming")}
            onPress={() => navigation.navigate("Upcoming")}
            size="lg"
          />
          <IconButton
            Icon={MoreHoriz}
            accessibilityLabel={t("feat.playback.extra.options")}
            onPress={() => playbackOptionsSheetRef.current?.present()}
            size="lg"
          />
        </View>
      </View>
    </>
  );
}

function SleepTimerButton(props: { present: VoidFunction }) {
  const { t } = useTranslation();
  const sleepTimerActive = useSleepTimerStore((s) => s.endAt) !== null;
  return (
    <View className="relative">
      <IconButton
        Icon={Timer}
        accessibilityLabel={t("feat.sleepTimer.title")}
        onPress={props.present}
        size="lg"
      />
      {sleepTimerActive && (
        <View className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
      )}
    </View>
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
    <FilledIconButton
      Icon={KeyboardArrowDown}
      accessibilityLabel={t("form.back")}
      onPress={() => navigation.goBack()}
      size="lg"
    />
  );
}
//#endregion
