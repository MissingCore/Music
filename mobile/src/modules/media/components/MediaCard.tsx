import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { useGetColumn } from "@/hooks/useGetColumn";

import type { Maybe, Prettify } from "@/utils/types";
import { Loading } from "@/components/Loading";
import { StyledText } from "@/components/Typography";
import { MediaImage } from "./MediaImage";

//#region Media Card
export namespace MediaCard {
  export type Content = Prettify<
    MediaImage.ImageContent & {
      href: string;
      title: string;
      subtitle: string;
    }
  >;

  export type Props = Prettify<Content & { size: number }>;
}

/**
 * Card containing information about some media and navigate to that media's
 * page on click.
 */
export function MediaCard({
  href,
  title,
  subtitle,
  ...imgProps
}: MediaCard.Props) {
  return (
    <Pressable
      onPress={() => router.navigate(href as Href)}
      style={{ maxWidth: imgProps.size }}
      // The `w-full` is to ensure the component takes up all the space
      // specified by `maxWidth`.
      className="w-full active:opacity-75"
    >
      <MediaImage {...imgProps} />
      <StyledText numberOfLines={1} className="mt-1 text-sm">
        {title}
      </StyledText>
      <StyledText preset="dimOnCanvas" numberOfLines={1}>
        {subtitle}
      </StyledText>
    </Pressable>
  );
}
//#endregion

//#region Placeholder Data
/**
 * Placeholder content — useful in `<FlatList />` if we want to do
 * something special for the first item.
 */
export const MediaCardPlaceholderContent: MediaCard.Content = {
  href: "invalid-href",
  source: null,
  title: "",
  subtitle: "",
  type: "album",
};
//#endregion

//#region Media Card List
type MediaCardListProps = {
  data: Maybe<readonly MediaCard.Content[]>;
  emptyMessage?: string;
  isPending?: boolean;
  /**
   * Renders a special entry before all other data. This assumes at `data[0]`,
   * we have a `MediaCardPlaceholderContent`.
   */
  RenderFirst?: (props: { size: number }) => React.JSX.Element;
};

/** Hook for getting the presets used in the FlashList for `<MediaCardList />`. */
export function useMediaCardListPreset(props: MediaCardListProps) {
  const { count, width } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });

  return useMemo(
    () => ({
      numColumns: count,
      // ~40px for text content under `<MediaImage />` + 16px Margin Bottom
      estimatedItemSize: width + 40 + 16,
      data: props.data,
      keyExtractor: ({ href }) => href,
      /*
        Utilized janky margin method to implement gaps in FlashList with columns.
          - https://github.com/shopify/flash-list/discussions/804#discussioncomment-5509022
      */
      renderItem: ({ item, index }) => (
        <View className="mx-2 mb-4">
          {props.RenderFirst && index === 0 ? (
            <props.RenderFirst size={width} />
          ) : (
            <MediaCard {...item} size={width} />
          )}
        </View>
      ),
      ListEmptyComponent: props.isPending ? (
        <Loading />
      ) : (
        <StyledText center>{props.emptyMessage}</StyledText>
      ),
      ListHeaderComponentStyle: { paddingHorizontal: 8 },
      className: "-mx-2 -mb-4",
    }),
    [count, width, props],
  ) satisfies FlashListProps<MediaCard.Content>;
}

/** Lists out `<MediaCard />` in a grid. */
export function MediaCardList(props: MediaCardListProps) {
  const presets = useMediaCardListPreset(props);
  return <FlashList {...presets} showsVerticalScrollIndicator={false} />;
}
//#endregion
