import type { ContentStyle } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";

import type { TrackListSource } from "@/features/playback/types";

import type { Maybe } from "@/utils/types";
import type { MediaList } from "@/components/media/types";
import type { TrackContent } from "./Track";
import { Track } from "./Track";

/** @description Lists out tracks. */
export function TrackList(props: {
  data: Maybe<readonly TrackContent[]>;
  config: {
    source: TrackListSource;
    origin?: MediaList;
    hideImage?: boolean;
  };
  ListEmptyComponent?: React.ComponentProps<
    typeof FlashList
  >["ListEmptyComponent"];
  contentContainerStyle?: ContentStyle;
}) {
  const { source, origin, hideImage = false } = props.config;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <Track {...{ ...item, origin, hideImage }} trackSource={source} />
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={props.ListEmptyComponent}
      contentContainerStyle={{
        paddingBottom: 8,
        paddingHorizontal: 4,
        paddingTop: 16,
        ...props.contentContainerStyle,
      }}
    />
  );
}
