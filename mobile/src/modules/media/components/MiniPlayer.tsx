import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideOutDown,
} from "react-native-reanimated";

import { Pause } from "@/icons/Pause";
import { PlayArrow } from "@/icons/PlayArrow";
import { useMusicStore } from "../services/Music";
import { MusicControls } from "../services/Playback";
import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { Marquee } from "@/components/Containment/Marquee";
import { IconButton } from "@/components/Form";
import { StyledText } from "@/components/Typography";
import { NextButton, PreviousButton } from "./MediaControls";
import { MediaImage } from "./MediaImage";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ hidden = false, stacked = false }) {
  const { t } = useTranslation();
  const { surface } = useTheme();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const track = useMusicStore((state) => state.activeTrack);

  if (!track || hidden) return null;

  const Icon = isPlaying ? Pause : PlayArrow;

  return (
    <Animated.View
      exiting={SlideOutDown.duration(1000)}
      layout={LinearTransition}
      className={cn("overflow-hidden rounded-md bg-canvas", {
        "rounded-b-sm": stacked,
      })}
    >
      <Pressable
        onPress={() => router.navigate("/current-track")}
        className="flex-row items-center bg-surface p-2 active:opacity-75"
      >
        <MediaImage type="track" radius="sm" size={48} source={track.artwork} />

        <View className="ml-2 shrink grow">
          <Marquee color={surface}>
            <StyledText>{track.name}</StyledText>
          </Marquee>
          <Marquee color={surface}>
            <StyledText dim>{track.artistName ?? "—"}</StyledText>
          </Marquee>
        </View>

        <View className="flex-row items-center">
          <PreviousButton />
          <IconButton
            kind="ripple"
            accessibilityLabel={t(`common.${isPlaying ? "pause" : "play"}`)}
            onPress={MusicControls.playToggle}
            rippleRadius={24}
            className="p-2"
          >
            <Icon size={32} color={Colors.red} />
          </IconButton>
          <NextButton />
        </View>
      </Pressable>
    </Animated.View>
  );
}
