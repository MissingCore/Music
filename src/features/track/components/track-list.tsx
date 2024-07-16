import type { ContentStyle } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";

import type { TrackListSource } from "@/features/playback/types";

import type { Maybe } from "@/utils/types";
import type { MediaList } from "@/components/media/types";
import { Track } from "./track";

type FlashListProps = React.ComponentProps<typeof FlashList>;

/** Lists out tracks. */
export function TrackList(props: {
  data: Maybe<readonly Track.Content[]>;
  config: {
    source: TrackListSource;
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
