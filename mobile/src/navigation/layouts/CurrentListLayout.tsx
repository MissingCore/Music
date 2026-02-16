import { useCallback } from "react";
import { View, useWindowDimensions } from "react-native";
import type { FlatListPropsWithLayout } from "react-native-reanimated";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Schedule } from "~/resources/icons/Schedule";
import { useInForeground } from "~/stores/ListenerState";
import { usePlaybackStore } from "~/stores/Playback/store";

import { cn } from "~/lib/style";
import { clamp } from "~/utils/number";
import { ScrollablePresets } from "~/components/Defaults";
import { TopDownGradient } from "~/components/Gradient";
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
}: FlatListPropsWithLayout<TData> & {
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
} & Omit<ListArtworkProps, "size">) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollPosition = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollPosition.value = e.contentOffset.y;
    },
  });

  const stickyStyles = useAnimatedStyle(() => ({
    paddingTop: insets.top + 8,
    opacity: headerHeight.value === 0 ? 0 : 1,
    transform: [
      { translateY: Math.max(0, headerHeight.value - scrollPosition.value) },
    ],
  }));

  const imageSize = clamp(0, ((width - 32) * 2) / 3, 384);
  const topOffset = insets.top + ESTIMATED_TOPAPPBAR_HEIGHT + 16;

  return (
    <>
      <Animated.FlatList
        {...ScrollablePresets}
        windowSize={3} // We don't need that many screens rendered on mount.
        {...props}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View
            onLayout={(e) => {
              headerHeight.value = e.nativeEvent.layout.height - topOffset;
            }}
            style={{ paddingTop: topOffset, paddingBottom: 72 }}
            className="gap-4"
          >
            <View className="items-center">
              {listSource.type === "artist" ? (
                <MediaImage
                  type="artist"
                  source={imageSource as string | null}
                  size={imageSize}
                />
              ) : (
                <AnimatedVinyl
                  size={imageSize}
                  listSource={listSource}
                  imageSource={imageSource}
                />
              )}
            </View>
            <View className="flex-row items-center gap-4">
              <View className="shrink grow gap-1">
                <Marquee>
                  <Em className="text-lg">{title}</Em>
                </Marquee>
                {artists ? (
                  <ArtistsLink artistNames={artists} popStrategy="popTo" />
                ) : null}
                <Marquee contentContainerClassName="gap-0">
                  <StyledText dim className="text-xxs">
                    {metadata.toSpliced(-1).join(" • ")}
                  </StyledText>
                  {/* Work around for RTL languages. */}
                  <StyledText dim className="text-xxs">
                    {" • "}
                  </StyledText>
                  <Schedule size={12} color="onSurfaceVariant" />
                  <StyledText dim className="text-xxs">
                    {` ${metadata.at(-1)!}`}
                  </StyledText>
                </Marquee>
              </View>
              {Actions}
            </View>
          </View>
        }
        contentContainerClassName={cn("px-4", props.contentContainerClassName)}
      />

      <TopDownGradient
        height={topOffset}
        startFrom={insets.top}
        className="absolute top-0 left-0"
      />
      <Animated.View
        pointerEvents="box-none"
        style={stickyStyles}
        className="absolute top-0 left-0 z-10 w-full items-end px-4"
      >
        <MediaListControls trackSource={listSource} />
      </Animated.View>
    </>
  );
}
//#endregion

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
