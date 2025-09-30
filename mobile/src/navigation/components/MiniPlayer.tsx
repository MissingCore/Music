import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useIsPlaying } from "~/modules/media/hooks/useIsPlaying";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { BounceSwipeable } from "~/components/BounceSwipeable";
import { Marquee } from "~/components/Containment/Marquee";
import { IconButton } from "~/components/Form/Button";
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
  const isPlaying = useIsPlaying();
  const track = useMusicStore((s) => s.activeTrack);
  const gestureUI = useUserPreferencesStore((s) => s.miniplayerGestures);

  const TextWrapper = useMemo(
    () => (gestureUI ? BounceSwipeable : View),
    [gestureUI],
  );

  if (!track || hidden) return null;
  return (
    <Animated.View
      layout={LinearTransition}
      className={cn("overflow-hidden rounded-md", { "rounded-b-sm": stacked })}
    >
      <Pressable
        onPress={() => navigation.navigate("NowPlaying")}
        className="flex-row items-center bg-surface px-2"
      >
        <MediaImage
          type="track"
          size={48}
          source={track.artwork}
          className="my-2 rounded-sm"
        />

        <TextWrapper
          onLeftIndicatorVisible={MusicControls.prev}
          onRightIndicatorVisible={MusicControls.next}
          shadowConfig={{ color: "surface" }}
          {...{
            [`${gestureUI ? "wrapperC" : "c"}lassName`]: "mx-2 shrink grow",
          }}
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
            onPress={MusicControls.playToggle}
            active
            large
          />
          {!gestureUI ? <NextButton /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
