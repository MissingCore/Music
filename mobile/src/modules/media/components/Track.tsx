import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { MoreVert } from "@/icons";
import { playFromMediaList } from "../services/Playback";
import type { PlayListSource } from "../types";

import { cn } from "@/lib/style";
import type { Maybe, Prettify } from "@/utils/types";
import { IconButton, Ripple } from "@/components/Form";
import { Loading } from "@/components/Loading";
import { StyledText } from "@/components/Typography";
import { MediaImage } from "./MediaImage";

//#region Track
export namespace Track {
  export type Content = {
    id: string;
    imageSource: MediaImage.ImageSource;
    title: string;
    description: string;
  };

  export type Props = Prettify<
    Content & {
      trackSource: PlayListSource;
      LeftElement?: React.JSX.Element;
    }
  >;
}

/**
 * Displays information about the current track with 2 different press
 * scenarios (pressing the icon or the whole card will do different actions).
 */
export function Track({ id, trackSource, ...props }: Track.Props) {
  const { t } = useTranslation();
  return (
    <Ripple
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
    >
      {props.LeftElement ? (
        props.LeftElement
      ) : (
        <MediaImage
          type="track"
          size={48}
          source={props.imageSource}
          radius="sm"
        />
      )}
      <View className="shrink grow">
        <StyledText numberOfLines={1} className="text-sm">
          {props.title}
        </StyledText>
        <StyledText preset="dimOnCanvas" numberOfLines={1}>
          {props.description}
        </StyledText>
      </View>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
        onPress={() => SheetManager.show("track-sheet", { payload: { id } })}
      >
        <MoreVert />
      </IconButton>
    </Ripple>
  );
}
//#endregion

//#region Track List
type TrackListProps = {
  data: Maybe<readonly Track.Content[]>;
  emptyMessage?: string;
  isPending?: boolean;
  trackSource: PlayListSource;
};

/** Presets used in the FlashList for `<TrackList />`. */
export const TrackListPreset = (props: TrackListProps) =>
  ({
    estimatedItemSize: 56, // 48px Height + 8px Margin Top
    data: props.data,
    keyExtractor: ({ id }) => id,
    renderItem: ({ item, index }) => (
      <View className={cn({ "mt-2": index > 0 })}>
        <Track {...item} trackSource={props.trackSource} />
      </View>
    ),
    ListEmptyComponent: props.isPending ? (
      <Loading />
    ) : (
      <StyledText center>{props.emptyMessage}</StyledText>
    ),
  }) satisfies FlashListProps<Track.Content>;

/** Lists out tracks. */
export function TrackList(props: TrackListProps) {
  return (
    <FlashList
      {...TrackListPreset(props)}
      showsVerticalScrollIndicator={false}
    />
  );
}
//#endregion
