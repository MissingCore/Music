import type { ContentStyle, ListRenderItem } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";

import type { TTrackSrc } from "@/features/playback/utils/trackList";

import { AnimatedCover } from "@/components/media/AnimatedCover";
import { TextLine } from "@/components/ui/Text";
import {
  PlayButton,
  RepeatButton,
  ShuffleButton,
} from "@/features/playback/components/MediaControls";

/** @description Header component seen on the `(current)` pages. */
export function MediaListHeader(props: {
  /** Displays an animated vinyl image above the title. */
  imgSrc?: React.ComponentProps<typeof AnimatedCover>["imgSrc"];
  title: string;
  /** Component placed underneath the title. */
  subtitleComponent?: React.JSX.Element;
  /** Strings describing the media (ie: total playtime, number of tracks.) */
  metadata: string[];
  trackSrc: TTrackSrc;
}) {
  return (
    <View className="border-b border-b-surface50 px-1 pb-2">
      {/* Image type from our database is: `string | null`. */}
      {props.imgSrc !== undefined && (
        <AnimatedCover imgSrc={props.imgSrc} className="mb-2" />
      )}
      <TextLine className="font-geistMono text-lg text-foreground50">
        {props.title}
      </TextLine>
      {props.subtitleComponent}
      <View className="mt-1 flex-row items-center gap-8">
        <TextLine className="flex-1 font-geistMonoLight text-xs text-foreground100">
          {props.metadata.join(" • ")}
        </TextLine>
        <View className="flex-row items-center">
          <RepeatButton />
          <ShuffleButton />
          <PlayButton trackSrc={props.trackSrc} className="ml-2" />
        </View>
      </View>
    </View>
  );
}

/**
 * @description Lists out tracks on the `(current)` pages. This should
 *  render `<ActionButton />` components.
 */
export function MediaList<TData extends { id: string }>(props: {
  data: readonly TData[] | undefined | null;
  renderItem: ListRenderItem<TData> | undefined | null;
  ListEmptyComponent?: React.ComponentProps<
    typeof FlashList
  >["ListEmptyComponent"];
  contentContainerStyle?: ContentStyle;
}) {
  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={props.renderItem}
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
