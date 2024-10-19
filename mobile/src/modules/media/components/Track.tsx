import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { MoreVert } from "@/resources/icons";
import { playFromMediaList } from "../services/Playback";
import type { PlayListSource } from "../types";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { cn } from "@/lib/style";
import type { Maybe, Prettify } from "@/utils/types";
import { Ripple } from "@/components/new/Form";
import { Loading } from "@/components/new/Loading";
import { StyledText } from "@/components/new/Typography";
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
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <Ripple
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      wrapperClassName="rounded-sm"
      className="p-0"
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

//#region Track List
/** Lists out tracks. */
export function TrackList(
  props: {
    data: Maybe<readonly Track.Content[]>;
    emptyMessage: string;
    isLoading?: boolean;
    trackSource: PlayListSource;
  } & Pick<FlashListProps<Track.Content>, "renderScrollComponent">,
) {
  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Botton
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item, index }) => (
        <View className={cn({ "mt-2": index > 0 })}>
          <Track {...item} trackSource={props.trackSource} />
        </View>
      )}
      ListEmptyComponent={
        props.isLoading ? (
          <Loading />
        ) : (
          <StyledText center>{props.emptyMessage}</StyledText>
        )
      }
      renderScrollComponent={props.renderScrollComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}
//#endregion
