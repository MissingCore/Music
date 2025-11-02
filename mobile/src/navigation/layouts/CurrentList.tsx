import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Schedule } from "~/resources/icons/Schedule";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { OnRTLWorklet } from "~/lib/react";
import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { Marquee } from "~/components/Containment/Marquee";
import { Divider } from "~/components/Divider";
import { StyledText, TEm } from "~/components/Typography/StyledText";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { Vinyl } from "~/modules/media/components/Vinyl";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";

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
  const navigation = useNavigation();
  const { foreground } = useTheme();
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  const isFavorite = getIsFavoritePlaylist(props.mediaSource);

  return (
    <>
      <View className="flex-row gap-2 pr-4">
        <ContentImage
          mediaSource={props.mediaSource}
          imageSource={props.imageSource}
        />
        <View className="shrink grow justify-end">
          <TEm
            dim
            textKey={`term.${toLowerCase(props.mediaSource.type)}`}
            style={{ fontSize: 8 }}
          />
          <Marquee>
            <StyledText>
              {isFavorite ? t("term.favoriteTracks") : props.title}
            </StyledText>
          </Marquee>
          {props.artist ? (
            <Marquee>
              <Pressable
                onPress={() =>
                  navigation.navigate(
                    "Artist",
                    { id: props.artist! },
                    { pop: true },
                  )
                }
              >
                <Text
                  style={{ fontFamily: getFont(primaryFont) }}
                  className="text-left text-xs text-red"
                >
                  {props.artist}
                </Text>
              </Pressable>
            </Marquee>
          ) : null}
          <Marquee wrapperClassName="my-1">
            <View className="flex-row items-center">
              <StyledText dim className="text-xxs">
                {props.metadata.toSpliced(-1).join(" • ")}
              </StyledText>
              {/* Work around for RTL languages. */}
              <StyledText dim className="text-xxs">
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
function ContentImage(props: AnimatedVinylProps) {
  if (props.mediaSource.type === "artist") {
    return (
      <MediaImage
        type="artist"
        source={props.imageSource as string | null}
        size={128}
        className="ml-4"
      />
    );
  } else {
    return <AnimatedVinyl {...props} />;
  }
}

type AnimatedVinylProps = {
  mediaSource: MediaListSource;
  imageSource: ImageSource;
};

/** Have the vinyl spin if the playing media list is this source. */
function AnimatedVinyl(props: AnimatedVinylProps) {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const coverPosition = useSharedValue(0);
  const rotationProgress = useSharedValue(0);
  const _discOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying && arePlaybackSourceEqual(playingSource, props.mediaSource)) {
      // `rotationProgress.value` becomes the new starting point when we
      // cancel the animation (hence the `+ 360`).
      rotationProgress.value = withRepeat(
        withTiming(rotationProgress.value + 360, {
          duration: 24000,
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
    transform: [{ translateX: OnRTLWorklet.flipSign(coverPosition.value) }],
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
      <View needsOffscreenAlphaCompositing>
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
function getIsFavoritePlaylist({ type, id }: MediaListSource) {
  return id === ReservedPlaylists.favorites && type === "playlist";
}
