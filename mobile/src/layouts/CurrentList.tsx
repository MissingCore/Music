import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Schedule } from "@/icons/Schedule";
import { useTheme } from "@/hooks/useTheme";

import { pickKeys } from "@/utils/object";
import { capitalize, toLowerCase } from "@/utils/string";
import { Marquee } from "@/components/Containment/Marquee";
import { Divider } from "@/components/Divider";
import { StyledText, TEm } from "@/components/Typography/StyledText";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components/MediaImage";
import { MediaListControls } from "@/modules/media/components/MediaListControls";
import { Vinyl } from "@/modules/media/components/Vinyl";
import type { MediaType, PlayListSource } from "@/modules/media/types";

type ImageSource = MediaImage.ImageSource | Array<string | null>;

/** List of media that we can change artwork for. */
const SupportedArtwork = new Set<MediaType>(["artist", "playlist"]);

/** Layout for displaying a list of tracks for the specified media. */
export function CurrentListLayout(props: {
  title: string;
  /** If we want to have a link to the artist underneath the title. */
  artist?: string;
  /** Strings describing the media (last string indicates total playtime). */
  metadata: string[];
  imageSource: ImageSource;
  mediaSource: PlayListSource;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { canvas, foreground } = useTheme();

  const isFavorite = getIsFavoritePlaylist(props.title, props.mediaSource.type);

  return (
    <>
      <View className="flex-row gap-2 px-4">
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
function ContentImage(props: {
  title: string;
  mediaSource: PlayListSource;
  imageSource: ImageSource;
}) {
  const { t } = useTranslation();

  const type = props.mediaSource.type;
  const renderMediaImage =
    getIsFavoritePlaylist(props.title, type) || !SupportedArtwork.has(type);

  if (renderMediaImage) {
    return <RenderImage type={type} source={props.imageSource} />;
  }

  return (
    <Pressable
      aria-label={t("playlist.artworkChange")}
      delayLongPress={100}
      onLongPress={() => {
        SheetManager.show(`${capitalize(type)}ArtworkSheet`, {
          payload: { id: props.title },
        });
      }}
      className="active:opacity-75"
    >
      <RenderImage
        type={type}
        source={props.imageSource}
        asImage={type === "artist"}
      />
    </Pressable>
  );
}

function RenderImage(props: {
  type: MediaType;
  source: ImageSource;
  asImage?: boolean;
}) {
  if (props.asImage) {
    return (
      /* @ts-expect-error Things should be fine with proper usage. */
      <MediaImage type={props.type} source={props.source} size={128} />
    );
  }
  return <Vinyl source={props.source} size={128} />;
}

/** Determine if whether this layout is for the "Favorite Playlists" page. */
function getIsFavoritePlaylist(title: string, type: MediaType) {
  return title === ReservedPlaylists.favorites && type === "playlist";
}
