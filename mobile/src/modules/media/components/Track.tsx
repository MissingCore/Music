import type { ContentStyle } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { MoreVert } from "@/resources/icons";
import { playFromMediaList } from "../services/Playback";
import type { MediaList, PlayListSource } from "../types";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { formatSeconds } from "@/utils/number";
import type { Maybe, Prettify } from "@/utils/types";
import { Ripple } from "@/components/new/Form";
import { StyledText } from "@/components/new/Typography";
import { MediaImage } from "./MediaImage";

import { ActionButton } from "@/components/form/action-button";

type FlashListProps = React.ComponentProps<typeof FlashList>;

//#region TrackNew
export namespace TrackNew {
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
export function TrackNew({ id, trackSource, ...props }: TrackNew.Props) {
  const { t } = useTranslation();
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <Ripple
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      wrapperClassName="rounded-sm"
      className="flex-row items-center justify-start gap-2 p-0"
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
      <Ripple
        preset="icon"
        accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
        onPress={() => openModal({ entity: "track", scope: "view", id })}
      >
        <MoreVert />
      </Ripple>
    </Ripple>
  );
}
//#endregion

//#region Track
export namespace Track {
  export type Content = {
    id: string;
    imageSource: MediaImage.ImageSource;
    duration: number;
    textContent: ActionButton.Props["textContent"];
  };

  export type Props = Prettify<
    Content & {
      trackSource: PlayListSource;
      origin?: MediaList;
      hideImage?: boolean;
    }
  >;
}

/**
 * Displays information about the current track with 2 different press
 * scenarios (pressing the icon or the whole card will do different actions).
 */
export function Track({ id, trackSource, origin, ...props }: Track.Props) {
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <ActionButton
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      textContent={props.textContent}
      Image={
        !props.hideImage ? (
          <MediaImage
            type="track"
            size={48}
            source={props.imageSource}
            className="shrink-0 rounded-sm"
          />
        ) : undefined
      }
      AsideContent={
        <Text className="shrink-0 font-geistMonoLight text-xs text-foreground100">
          {formatSeconds(props.duration)}
        </Text>
      }
      icon={{
        label: "View track settings.",
        onPress: () =>
          openModal({ entity: "track", scope: "view", id, origin }),
      }}
    />
  );
}
//#endregion

//#region Track List
/** Lists out tracks. */
export function TrackList(props: {
  data: Maybe<readonly Track.Content[]>;
  config: {
    source: PlayListSource;
    origin?: MediaList;
    hideImage?: boolean;
  };
  ListHeaderComponent?: FlashListProps["ListHeaderComponent"];
  ListEmptyComponent?: FlashListProps["ListEmptyComponent"];
  contentContainerStyle?: ContentStyle;
}) {
  const { source, origin, hideImage = false } = props.config;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <View className="mb-2">
          <Track {...{ ...item, origin, hideImage }} trackSource={source} />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={props.ListHeaderComponent}
      ListEmptyComponent={props.ListEmptyComponent}
      contentContainerStyle={{
        paddingHorizontal: 4,
        paddingTop: 16,
        ...props.contentContainerStyle,
      }}
    />
  );
}
//#endregion
