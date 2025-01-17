import { Link } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Schedule } from "@/icons/Schedule";
import { useMusicStore } from "@/modules/media/services/Music";
import { useTheme } from "@/hooks/useTheme";

import { pickKeys } from "@/utils/object";
import { capitalize, toLowerCase } from "@/utils/string";
import { Marquee } from "@/components/Containment/Marquee";
import { Divider } from "@/components/Divider";
import { StyledText, TEm } from "@/components/Typography/StyledText";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components/MediaImage";
import { MediaListControls } from "@/modules/media/components/MediaListControls";
import { arePlaybackSourceEqual } from "@/modules/media/helpers/data";
import { Vinyl } from "@/modules/media/components/Vinyl";

type SupportedMedia = "album" | "artist" | "playlist";
type MediaListSource = { type: SupportedMedia; id: string };
type ImageSource = MediaImage.ImageSource | MediaImage.ImageSource[];

/** Layout for displaying a list of tracks for the specified media. */
export function CurrentListLayout(
  props: {
    title: string;
    /** If we want to have a link to the artist underneath the title. */
    artist?: string;
    /** Strings describing the media (last string indicates total playtime). */
    metadata: string[];
    children: React.ReactNode;
  } & AnimatedVinylProps,
) {
  const { t } = useTranslation();
  const { canvas, foreground } = useTheme();

  const isFavorite = getIsFavoritePlaylist(props.title, props.mediaSource.type);

  return (
    <>
      <View className="flex-row gap-2 pr-4">
        <ContentImage
          {...pickKeys(props, ["title", "mediaSource", "imageSource"])}
        />
        <View className="shrink grow justify-end">
          <TEm
            dim
            textKey={`common.${toLowerCase(props.mediaSource.type)}`}
            style={{ fontSize: 8 }}
          />
          <Marquee color={canvas}>
            <StyledText>
              {isFavorite ? t("common.favoriteTracks") : props.title}
            </StyledText>
          </Marquee>
          {props.artist ? (
            <Marquee color={canvas}>
              <Link
                href={`/artist/${encodeURIComponent(props.artist)}`}
                className="font-roboto text-xs text-red"
              >
                {props.artist}
              </Link>
            </Marquee>
          ) : null}
          <Marquee color={canvas} wrapperClassName="my-1">
            <View className="flex-row items-center">
              <StyledText dim className="text-xxs">
                {props.metadata.toSpliced(-1).join(" • ")}
                {" • "}
              </StyledText>
              <Schedule size={12} color={`${foreground}99`} />
              <StyledText dim className="text-xxs">
                {` ${props.metadata.at(-1)!}`}
              </StyledText>
            </View>
          </Marquee>
          <MediaListControls
            trackSource={props.mediaSource}
            className="ml-auto"
          />
        </View>
      </View>
      <Divider className="m-4 mb-0" />
      {props.children}
    </>
  );
}

/** Determines the look and features of the image displayed. */
function ContentImage({
  title,
  ...props
}: { title: string } & AnimatedVinylProps) {
  const { t } = useTranslation();

  const type = props.mediaSource.type;

  if (getIsFavoritePlaylist(title, type) || type === "album")
    return <AnimatedVinyl {...props} />;

  return (
    <Pressable
      aria-label={t("playlist.artworkChange")}
      delayLongPress={100}
      onLongPress={() => {
        SheetManager.show(`${capitalize(type)}ArtworkSheet`, {
          payload: { id: title },
        });
      }}
      className="group"
    >
      {type === "artist" ? (
        <MediaImage
          type="artist"
          source={props.imageSource as string | null}
          size={128}
          className="ml-4 group-active:opacity-75"
        />
      ) : (
        <AnimatedVinyl {...props} />
      )}
    </Pressable>
  );
}

type AnimatedVinylProps = {
  mediaSource: MediaListSource;
  imageSource: ImageSource;
};

/** Have the vinyl spin if the playing media list is this source. */
function AnimatedVinyl(props: AnimatedVinylProps) {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const playingSource = useMusicStore((state) => state.playingSource);
  const coverPosition = useSharedValue(0);
  const rotationProgress = useSharedValue(0);
  const _discOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying && arePlaybackSourceEqual(playingSource, props.mediaSource)) {
      // `rotationProgress.value` becomes the new starting point when we
      // cancel the animation (hence the `+ 360`).
      rotationProgress.value = withRepeat(
        withTiming(rotationProgress.value + 360, {
          duration: 15000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotationProgress);
    }
  }, [props.mediaSource, isPlaying, playingSource, rotationProgress]);

  // Since the cover size is fixed, we know how much to translate.
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: coverPosition.value }],
  }));

  const diskStyle = useAnimatedStyle(() => ({
    // The SVG flashes in on 1st mount, so the opacity is there to combat it.
    opacity: _discOpacity.value,
    transform: [{ rotate: `${rotationProgress.value}deg` }],
  }));

  return (
    <Animated.View
      onLayout={() => {
        coverPosition.value = withDelay(50, withTiming(-64, { duration: 500 }));
        _discOpacity.value = withTiming(1, { duration: 50 });
      }}
      className="ml-4"
    >
      <View className="group-active:opacity-75">
        <Animated.View style={diskStyle}>
          <Vinyl source={props.imageSource} size={128} />
        </Animated.View>
      </View>
      <Animated.View style={coverStyle} className="absolute left-0 top-0 z-10">
        {/* @ts-expect-error Things should be fine with proper usage. */}
        <MediaImage
          type={props.mediaSource.type}
          source={props.imageSource}
          size={128}
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Determine if whether this layout is for the "Favorite Playlists" page. */
function getIsFavoritePlaylist(title: string, type: SupportedMedia) {
  return title === ReservedPlaylists.favorites && type === "playlist";
}
