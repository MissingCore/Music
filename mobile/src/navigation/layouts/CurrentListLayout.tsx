import { useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View, useWindowDimensions } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Schedule } from "~/resources/icons/Schedule";
import { useInForeground } from "~/stores/ListenerState";
import { usePlaybackStore } from "~/stores/Playback/store";
import { useDelayedReady } from "~/hooks/useDelayedReady";

import { cn } from "~/lib/style";
import { clamp } from "~/utils/number";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { TopDownGradient } from "~/components/Gradient";
import { Marquee } from "~/components/Marquee";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { Vinyl } from "~/modules/media/components/Vinyl";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";

type SupportedMedia = "album" | "artist" | "genre" | "playlist";
type MediaListSource = { type: SupportedMedia; id: string };

const ESTIMATED_TOPAPPBAR_HEIGHT = 56;
const ESTIMATED_TOPAPPBAR_YPAD = 8;

//#region Layout
export function CurrentListLayout<TData>({
  data = [],
  listSource,
  imageSource,
  listInfo,
  SubHeader,
  ...props
}: LegendListProps<TData> & {
  listInfo: ListInfoProps;
  SubHeader?: React.ReactNode;
} & Omit<ListArtworkProps, "size">) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const imageSize = clamp(0, ((width - 32) * 2) / 3, 384);
  // How far from the top edge of the screen the media controls will be sticked to.
  const minStickyTopOffset = insets.top + ESTIMATED_TOPAPPBAR_YPAD;
  // How far from the top edge of the screen the artwork will start from.
  const contentStartOffset = insets.top + ESTIMATED_TOPAPPBAR_HEIGHT + 16;

  //#region Header Height Calculations
  const headerHeight = useSharedValue(-1);
  const setHeaderHeight = useCallback(
    (e: LayoutChangeEvent) =>
      headerHeight.set(
        Math.round(
          e.nativeEvent.layout.height -
            contentStartOffset +
            ESTIMATED_TOPAPPBAR_YPAD,
        ),
      ),
    [headerHeight, contentStartOffset],
  );
  //#endregion

  //#region Sticky Animation
  const scrollPosition = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      "worklet";
      scrollPosition.set(e.contentOffset.y);
    },
  });

  const stickyStyles = useAnimatedStyle(() => ({
    opacity: headerHeight.get() === -1 ? 0 : 1,
    paddingTop: minStickyTopOffset,
    transform: [
      { translateY: Math.max(0, headerHeight.get() - scrollPosition.get()) },
    ],
  }));
  //#endregion

  //#region Layout Estimations
  const getItemType = useCallback((item: any) => {
    if (typeof item === "number" || typeof item === "string") return "label";
    return "row";
  }, []);
  //#endregion

  return (
    <>
      <LegendList
        {...props}
        estimatedHeaderSize={Math.round(
          contentStartOffset -
            minStickyTopOffset +
            imageSize +
            (listInfo.artists ? 70 : 50) +
            32, // Required gaps
        )}
        estimatedItemSize={56}
        data={data}
        getItemType={getItemType}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            <View
              onLayout={setHeaderHeight}
              style={{ paddingTop: contentStartOffset, paddingBottom: 72 }}
              className="items-center gap-4"
            >
              <DeferredArtwork
                size={imageSize}
                listSource={listSource}
                imageSource={imageSource}
              />
              <ListInfo {...listInfo} />
            </View>
            {SubHeader}
          </View>
        }
        contentContainerClassName={cn("px-4", props.contentContainerClassName)}
      />

      <TopDownGradient
        height={contentStartOffset}
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

//#region List Info
type ListInfoProps = {
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
};

function ListInfo(props: ListInfoProps) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <Em className="text-lg">{props.title}</Em>
        </Marquee>
        {props.artists ? (
          <ArtistsLink artists={props.artists} popStrategy="popTo" />
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
  );
}
//#endregion

//#region Artwork Preview
type ListArtworkProps = {
  size: number;
  listSource: MediaListSource;
  imageSource: MediaImage.ImageSource;
};

function DeferredArtwork(props: ListArtworkProps) {
  // Defer rendering vinyl as it's "heavy" and causes stutters when navigating to this screen.
  const isReady = useDelayedReady(500);

  // Additional container styling.
  const horizTranslation = useSharedValue(0);
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -horizTranslation.get() }],
  }));

  return (
    <Animated.View style={coverStyle} className="relative">
      {isReady && props.listSource.type !== "artist" ? (
        <AnimatedVinyl {...props} horizTranslation={horizTranslation} />
      ) : null}
      <MediaImage
        type={props.listSource.type}
        source={props.imageSource}
        size={props.size}
      />
    </Animated.View>
  );
}

function AnimatedVinyl(
  props: ListArtworkProps & { horizTranslation: SharedValue<number> },
) {
  const inForeground = useInForeground();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const playingSource = usePlaybackStore((s) => s.playingFrom);

  const canAnimate =
    isPlaying && arePlaybackSourceEqual(playingSource, props.listSource);

  const onMount = useCallback(() => {
    props.horizTranslation.set(withTiming(props.size / 4, { duration: 500 }));
  }, [props.horizTranslation, props.size]);

  const discStyle = useAnimatedStyle(() => ({
    // Multiplied by 2 due to also needing to account the translation of the parent.
    transform: [{ translateX: props.horizTranslation.get() * 2 }],
  }));

  return (
    <Animated.View
      onLayout={onMount}
      style={discStyle}
      className="absolute inset-0"
    >
      <Animated.View
        style={{
          animationName: {
            from: { transform: [{ rotate: "0deg" }] },
            to: { transform: [{ rotate: "360deg" }] },
          },
          animationDuration: 24000,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: canAnimate && inForeground ? "running" : "paused",
        }}
      >
        <Vinyl source={props.imageSource} size={props.size} />
      </Animated.View>
    </Animated.View>
  );
}
//#endregion
