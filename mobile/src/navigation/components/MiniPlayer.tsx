import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { useUserPreferencesStore } from "~/services/UserPreferences";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Marquee } from "~/components/Containment/Marquee";
import { IconButton } from "~/components/Form/Button";
import { Swipeable } from "~/components/Swipeable";
import { StyledText } from "~/components/Typography/StyledText";
import {
  NextButton,
  PreviousButton,
} from "~/modules/media/components/MediaControls";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { usePlayerProgress } from "../screens/now-playing/helpers/usePlayerProgress";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ hidden = false, stacked = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const track = usePlaybackStore((s) => s.activeTrack);
  const gestureUI = useUserPreferencesStore((s) => s.miniplayerGestures);

  const TextWrapper = useMemo(
    () => (gestureUI ? Swipeable : View),
    [gestureUI],
  );

  if (!track || hidden) return null;
  return (
    <Animated.View
      layout={LinearTransition}
      className={cn("overflow-hidden rounded-md bg-surface", {
        "rounded-b-sm": stacked,
      })}
    >
      <Pressable
        onPress={() => navigation.navigate("NowPlaying")}
        className="flex-row items-center px-2"
      >
        <MediaImage
          type="track"
          size={48}
          source={track.artwork}
          className="mb-1.5 mt-2 rounded-sm"
        />

        <TextWrapper
          activationThreshold={24}
          overshootSwipe={false}
          onSwipeLeft={PlaybackControls.next}
          onSwipeRight={PlaybackControls.prev}
          wrapperClassName="shrink grow justify-center overflow-hidden"
          className={gestureUI ? "bg-surface px-2" : "mx-2 shrink grow"}
        >
          <Marquee color="surface">
            <StyledText>{track.name}</StyledText>
          </Marquee>
          <Marquee color="surface">
            <StyledText dim>{track.artistName ?? "—"}</StyledText>
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
            active
            large
          />
          {!gestureUI ? <NextButton /> : null}
        </View>
      </Pressable>
      <TrackProgress duration={track.duration} />
    </Animated.View>
  );
}

function TrackProgress({ duration }: { duration: number }) {
  const { position } = usePlayerProgress();
  const progressPercent = `${(position / duration) * 100}%` as const;

  return (
    <View className="px-2">
      <View className="h-0.5 w-full rounded-full bg-onSurface">
        <View
          style={{ width: progressPercent }}
          className="h-full rounded-full bg-red"
        />
      </View>
    </View>
  );
}
