import type { ContentStyle } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { Text, View } from "react-native";

import { playFromMediaList } from "../services/Playback";
import type { MediaList, PlayListSource } from "../types";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { formatSeconds } from "@/utils/number";
import type { Maybe, Prettify } from "@/utils/types";
import { ActionButton } from "@/components/form/action-button";
import { MediaImage } from "@/components/media/image";

type FlashListProps = React.ComponentProps<typeof FlashList>;

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
