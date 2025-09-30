import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useIsPlaying } from "~/modules/media/hooks/useIsPlaying";

import { cn } from "~/lib/style";
import { BounceSwipe } from "~/components/BounceSwipe";
import { Marquee } from "~/components/Containment/Marquee";
import { IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { MediaImage } from "~/modules/media/components/MediaImage";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ hidden = false, stacked = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isPlaying = useIsPlaying();
  const track = useMusicStore((state) => state.activeTrack);

  if (!track || hidden) return null;
  return (
    <Animated.View
      layout={LinearTransition}
      className={cn("overflow-hidden rounded-md bg-canvas", {
        "rounded-b-sm": stacked,
      })}
    >
      <Pressable
        onPress={() => navigation.navigate("NowPlaying")}
        className="flex-row items-center bg-surface p-2 active:opacity-75"
      >
        <MediaImage
          type="track"
          size={48}
          source={track.artwork}
          className="rounded-sm"
        />

        <BounceSwipe
          onLeftIndicatorVisible={MusicControls.prev}
          onRightIndicatorVisible={MusicControls.next}
          wrapperClassName="ml-2 shrink grow"
        >
          <Marquee color="surface">
            <StyledText>{track.name}</StyledText>
          </Marquee>
          <Marquee color="surface">
            <StyledText dim>{track.artistName ?? "—"}</StyledText>
          </Marquee>
        </BounceSwipe>

        <IconButton
          Icon={isPlaying ? Pause : PlayArrow}
          accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
          onPress={MusicControls.playToggle}
          active
          large
        />
      </Pressable>
    </Animated.View>
  );
}
