import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Schedule } from "@/icons";
import { useTheme } from "@/hooks/useTheme";

import { toLowerCase } from "@/utils/string";
import { Divider, Marquee } from "@/components/Containment";
import { StyledText } from "@/components/Typography";
import { MediaImage, MediaListControls } from "@/modules/media/components";
import type { PlayListSource } from "@/modules/media/types";

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

  return (
    <View className="flex-1 gap-4 p-4 pb-0">
      <View className="flex-row gap-2">
        {/* @ts-expect-error Things should be fine with proper usage. */}
        <MediaImage
          type={props.mediaSource.type}
          source={props.imageSource}
          size={128}
        />
        <View className="shrink grow justify-end">
          <StyledText preset="dimOnCanvas" bold style={{ fontSize: 8 }}>
            {t(
              `common.${toLowerCase(props.mediaSource.type)}`,
            ).toLocaleUpperCase()}
          </StyledText>
          <Marquee color={canvas}>
            <StyledText>{props.title}</StyledText>
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
              <StyledText preset="dimOnCanvas" className="text-xxs">
                {props.metadata.toSpliced(-1).join(" • ")}
                {" • "}
              </StyledText>
              <Schedule size={12} color={`${foreground}99`} />
              <StyledText preset="dimOnCanvas" className="text-xxs">
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
      <Divider />
      {props.children}
    </View>
  );
}
