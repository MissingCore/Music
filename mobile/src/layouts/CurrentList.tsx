import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Schedule } from "@/icons";
import { useTheme } from "@/hooks/useTheme";

import { capitalize, toLowerCase } from "@/utils/string";
import { Divider, Marquee } from "@/components/Containment";
import { StyledText, TEm } from "@/components/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage, MediaListControls } from "@/modules/media/components";
import type { MediaType, PlayListSource } from "@/modules/media/types";

/** List of media that we can change artwork for. */
const SupportedArtwork = new Set<MediaType>(["artist", "playlist"]);

/** Layout for displaying a list of tracks for the specified media. */
export function CurrentListLayout(props: {
  title: string;
  /** If we want to have a link to the artist underneath the title. */
  artist?: string;
  /** Strings describing the media (last string indicates total playtime). */
  metadata: string[];
  imageSource: MediaImage.ImageSource | Array<string | null>;
  mediaSource: PlayListSource;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { canvas, foreground } = useTheme();

  const isFavorite =
    props.title === ReservedPlaylists.favorites &&
    props.mediaSource.type === "playlist";

  return (
    <>
      <View className="flex-row gap-2 px-4">
        <Pressable
          disabled={isFavorite || !SupportedArtwork.has(props.mediaSource.type)}
          delayLongPress={300}
          onLongPress={() => {
            SheetManager.show(
              `${capitalize(props.mediaSource.type)}ArtworkSheet`,
              { payload: { id: props.title } },
            );
          }}
          className="active:opacity-75"
        >
          {/* @ts-expect-error Things should be fine with proper usage. */}
          <MediaImage
            type={props.mediaSource.type}
            source={props.imageSource}
            size={128}
          />
        </Pressable>
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
