import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideOutDown,
} from "react-native-reanimated";

import { Pause, PlayArrow } from "../resources/icons";
import { useMusicStore } from "../services/Music";
import { MusicControls } from "../services/Playback";
import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { Ripple } from "@/components/new/Form";
import { Marquee } from "@/components/new/Marquee";
import { StyledText } from "@/components/new/Typography";
import { NextButton, PreviousButton } from "./MediaControls";
import { MediaImage } from "./MediaImage";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ stacked = false }) {
  const { t } = useTranslation();
  const { canvas } = useTheme();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const track = useMusicStore((state) => state.activeTrack);

  if (!track) return null;

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
          <Marquee>
            <StyledText>{track.name}</StyledText>
          </Marquee>
          <Marquee>
            <StyledText preset="dimOnSurface">{track.artistName}</StyledText>
          </Marquee>
        </View>

        <View className="flex-row items-center">
          <PreviousButton rippleColor={`${canvas}40`} />
          <Ripple
            accessibilityLabel={t(`common.${isPlaying ? "pause" : "play"}`)}
            android_ripple={{ radius: 24, color: `${canvas}40` }}
            onPress={MusicControls.playToggle}
            className="p-2"
          >
            <Icon size={32} color={Colors.red} />
          </Ripple>
          <NextButton rippleColor={`${canvas}40`} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
