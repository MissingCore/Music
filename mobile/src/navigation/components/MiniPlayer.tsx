import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { getArtistsString } from "~/data/artist/utils";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { Swipeable } from "~/components/Swipeable";
import { StyledText } from "~/components/Typography/StyledText";
import {
  NextButton,
  PreviousButton,
} from "~/modules/media/components/MediaControls";
import { MediaImage } from "~/modules/media/components/MediaImage";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ hidden = false, stacked = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const track = usePlaybackStore((s) => s.activeTrack);
  const gestureUI = usePreferenceStore((s) => s.miniplayerGestures);
  const [isPressed, setIsPressed] = useState(false);

  const TextWrapper = useMemo(
    () => (gestureUI ? Swipeable : View),
    [gestureUI],
  );

  if (!track || hidden) {
    if (isPressed) setIsPressed(false); // Since `onPressOut` won't get called if this gets hidden.
    return null;
  }
  return (
    <View
      className={cn("overflow-hidden rounded-md bg-surfaceContainerLowest", {
        "rounded-b-xs": stacked,
        "bg-surfaceContainerLow": isPressed,
      })}
    >
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPress={() => navigation.navigate("NowPlaying")}
        onPressOut={() => setIsPressed(false)}
        className="flex-row items-center px-2"
      >
        <MediaImage
          type="track"
          size={48}
          source={track.artwork}
          className="mt-2 mb-1.5 rounded-xs"
        />

        <TextWrapper
          activationThreshold={32}
          overshootSwipe={false}
          onSwipeLeft={PlaybackControls.next}
          onSwipeRight={PlaybackControls.prev}
          wrapperClassName="shrink grow justify-center overflow-hidden"
          className={cn({
            "mx-2 shrink grow": !gestureUI,
            "bg-surfaceContainerLowest px-2": gestureUI,
            "bg-surfaceContainerLow": gestureUI && isPressed,
          })}
        >
          <Marquee color="surfaceContainerLowest">
            <StyledText>{track.name}</StyledText>
          </Marquee>
          <Marquee color="surfaceContainerLowest">
            <StyledText dim>{getArtistsString(track.artists)}</StyledText>
          </Marquee>
        </TextWrapper>

        <View
          style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
          className="items-center"
        >
          {!gestureUI ? <PreviousButton /> : null}
          <IconButton
            Icon={isPlaying ? Pause : PlayArrow}
            accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
            onPress={() => PlaybackControls.playToggle()}
            size="lg"
            _iconColor="primary"
          />
          {!gestureUI ? <NextButton /> : null}
        </View>
      </Pressable>
      <TrackProgress duration={track.duration} />
    </View>
  );
}

function TrackProgress({ duration }: { duration: number }) {
  const position = usePlaybackStore((s) => s.lastPosition);
  const progressPercent = `${(position / duration) * 100}%` as const;

  return (
    <View className="px-2">
      <View className="h-0.5 w-full rounded-full bg-surfaceContainerHigh">
        <View
          style={{ width: progressPercent }}
          className="h-full rounded-full bg-primary"
        />
      </View>
    </View>
  );
}
