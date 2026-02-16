import type { LegendListProps } from "@legendapp/list";
import { useCallback } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Schedule } from "~/resources/icons/Schedule";
import { useInForeground } from "~/stores/ListenerState";
import { usePlaybackStore } from "~/stores/Playback/store";

import { clamp } from "~/utils/number";
import { AnimatedLegendList } from "~/components/Defaults";
import { Marquee } from "~/components/Marquee";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { Vinyl } from "~/modules/media/components/Vinyl";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";

type SupportedMedia = "album" | "artist" | "playlist";
type MediaListSource = { type: SupportedMedia; id: string };

const ESTIMATED_TOPAPPBAR_HEIGHT = 56;

//#region Layout
export function CurrentListLayout<TData>({
  title,
  artists,
  metadata,
  Actions,
  listSource,
  imageSource,
  ...props
}: Omit<
  LegendListProps<TData>,
  "ListHeaderComponent" | "contentContainerClassName"
> &
  Omit<ListHeaderProps, "size">) {
  const { width } = useWindowDimensions();

  const imageSize = clamp(0, ((width - 32) * 2) / 3, 384);

  return (
    <AnimatedLegendList
      {...props}
      ListHeaderComponent={
        <CurrentListHeader
          title={title}
          artists={artists}
          metadata={metadata}
          Actions={Actions}
          size={imageSize}
          listSource={listSource}
          imageSource={imageSource}
        />
      }
      contentContainerClassName="px-4"
    />
  );
}
//#endregion

//#region List Header
type ListHeaderProps = {
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
} & ListArtworkProps;

function CurrentListHeader(props: ListHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: insets.top + ESTIMATED_TOPAPPBAR_HEIGHT + 16 }}
      className="gap-4 pb-4"
    >
      <View className="items-center">
        {props.listSource.type === "artist" ? (
          <MediaImage
            type="artist"
            source={props.imageSource as string | null}
            size={props.size}
          />
        ) : (
          <AnimatedVinyl
            size={props.size}
            listSource={props.listSource}
            imageSource={props.imageSource}
          />
        )}
      </View>

      <View className="flex-row items-center gap-4">
        <View className="shrink grow gap-1">
          <Marquee>
            <Em className="text-lg">{props.title}</Em>
          </Marquee>
          {props.artists ? (
            <ArtistsLink artistNames={props.artists} popStrategy="popTo" />
          ) : null}
          <Marquee contentContainerClassName="gap-0">
            <StyledText dim className="text-xxs">
              {props.metadata.toSpliced(-1).join(" • ")}
            </StyledText>
            {/* Work around for RTL languages. */}
            <StyledText dim className="text-xxs">
              {" • "}
            </StyledText>
            <Schedule size={12} color="onSurfaceVariant" />
            <StyledText dim className="text-xxs">
              {` ${props.metadata.at(-1)!}`}
            </StyledText>
          </Marquee>
        </View>
        {props.Actions}
      </View>

      <MediaListControls trackSource={props.listSource} className="ml-auto" />
    </View>
  );
}

//#region Artwork Preview
type ListArtworkProps = {
  size: number;
  listSource: MediaListSource;
  imageSource: MediaImage.ImageSource | MediaImage.ImageSource[];
};

function AnimatedVinyl(props: ListArtworkProps) {
  const inForeground = useInForeground();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const horizTranslation = useSharedValue(0);

  const canAnimate =
    isPlaying && arePlaybackSourceEqual(playingSource, props.listSource);

  const onMount = useCallback(() => {
    horizTranslation.value = withDelay(
      100,
      withTiming(props.size / 4, { duration: 500 }),
    );
  }, [horizTranslation, props.size]);

  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -horizTranslation.value }],
  }));
  const discStyle = useAnimatedStyle(() => ({
    // Multiplied by 2 due to also needing to account the translation of the parent.
    transform: [{ translateX: horizTranslation.value * 2 }],
  }));

  return (
    <Animated.View onLayout={onMount} style={coverStyle} className="relative">
      <Animated.View style={discStyle} className="absolute inset-0">
        <Animated.View
          style={{
            animationName: {
              from: { transform: [{ rotate: "0deg" }] },
              to: { transform: [{ rotate: "360deg" }] },
            },
            animationDuration: 24000,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState:
              canAnimate && inForeground ? "running" : "paused",
          }}
        >
          <Vinyl source={props.imageSource} size={props.size} />
        </Animated.View>
      </Animated.View>
      <MediaImage
        type={props.listSource.type}
        source={props.imageSource as string | null}
        size={props.size}
      />
    </Animated.View>
  );
}
//#endregion
//#endregion
