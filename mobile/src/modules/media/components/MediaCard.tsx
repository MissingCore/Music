import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";

import { useGetColumn } from "@/hooks/useGetColumn";

import { cn } from "@/lib/style";
import type { Maybe, Prettify } from "@/utils/types";
import type { WithListEmptyProps } from "@/components/Defaults";
import { useListPresets } from "@/components/Defaults";
import { StyledText } from "@/components/Typography";
import { MediaImage } from "./MediaImage";

//#region Media Card
export namespace MediaCard {
  export type Content = Prettify<
    MediaImage.ImageContent & {
      href: string;
      title: string;
      description: string;
    }
  >;

  export type Props = Prettify<
    Content & {
      size: number;
      className?: string;
      onLayout?: (e: LayoutChangeEvent) => void;
    }
  >;
}

/**
 * Card containing information about some media and navigate to that media's
 * page on click.
 */
export function MediaCard({
  href,
  title,
  description,
  className,
  onLayout,
  ...imgProps
}: MediaCard.Props) {
  return (
    <Pressable
      onLayout={onLayout}
      onPress={() => router.navigate(href as Href)}
      style={{ maxWidth: imgProps.size }}
      // The `w-full` is to ensure the component takes up all the space
      // specified by `maxWidth`.
      className={cn("w-full active:opacity-75", className)}
    >
      <MediaImage {...imgProps} />
      <StyledText numberOfLines={1} className="mt-1 text-sm">
        {title}
      </StyledText>
      <StyledText dim numberOfLines={1}>
        {description}
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
  description: "",
  type: "album",
};
//#endregion

//#region Media Card List
type MediaCardListProps = WithListEmptyProps<{
  data: Maybe<readonly MediaCard.Content[]>;
  /**
   * Renders a special entry before all other data. This assumes at `data[0]`,
   * we have a `MediaCardPlaceholderContent`.
   */
  RenderFirst?: (props: {
    size: number;
    className: string;
  }) => React.JSX.Element;
}>;

/** Hook for getting the presets used in the FlashList for `<MediaCardList />`. */
export function useMediaCardListPreset(props: MediaCardListProps) {
  const { count, width } = useGetColumn({
    ...{ cols: 2, gap: 12, gutters: 32, minWidth: 175 },
  });
  const listPresets = useListPresets({
    isPending: props.isPending,
    emptyMsgKey: props.emptyMsgKey,
  });

  return useMemo(
    () => ({
      ...listPresets,
      numColumns: count,
      // ~40px for text content under `<MediaImage />` + 16px Margin Bottom
      estimatedItemSize: width + 40 + 12,
      data: props.data,
      keyExtractor: ({ href }) => href,
      /*
        Utilized janky margin method to implement gaps in FlashList with columns.
          - https://github.com/shopify/flash-list/discussions/804#discussioncomment-5509022
      */
      renderItem: ({ item, index }) =>
        props.RenderFirst && index === 0 ? (
          <props.RenderFirst size={width} className="mx-1.5 mb-3" />
        ) : (
          <MediaCard {...item} size={width} className="mx-1.5 mb-3" />
        ),
      ListHeaderComponentStyle: { paddingHorizontal: 8 },
      className: "-mx-1.5 -mb-3",
    }),
    [count, width, props, listPresets],
  ) satisfies FlashListProps<MediaCard.Content>;
}

/** Lists out `<MediaCard />` in a grid. */
export function MediaCardList(props: MediaCardListProps) {
  const presets = useMediaCardListPreset(props);
  return <FlashList {...presets} />;
}
//#endregion
