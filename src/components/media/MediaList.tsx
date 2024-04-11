import type { ListRenderItem } from "react-native";
import { FlatList, View } from "react-native";

import { AnimatedCover } from "@/components/media/AnimatedCover";
import { MediaControl } from "@/components/media/MediaControls";
import { TextLine } from "@/components/ui/Text";

/** @description Header component seen on the `(current)` pages. */
export function MediaListHeader(props: {
  /** Displays an animated vinyl image above the title. */
  imgSrc?: React.ComponentProps<typeof AnimatedCover>["imgSrc"];
  title: string;
  /** Component placed underneath the title. */
  subtitleComponent?: React.JSX.Element;
  /** Strings describing the media (ie: total playtime, number of tracks.) */
  metadata: string[];
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
        <MediaControl />
      </View>
    </View>
  );
}

/** @description Lists out tracks on the `(current)` pages. */
export function MediaList<TData extends { id: string }>(props: {
  data: ArrayLike<TData> | undefined | null;
  renderItem: ListRenderItem<TData> | undefined | null;
}) {
  return (
    <FlatList
      initialNumToRender={15}
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={props.renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerClassName="gap-2 px-1 pb-12 pt-4"
    />
  );
}
