import type { LegendListProps } from "@legendapp/list";
import type { Href } from "expo-router";
import { useMemo } from "react";
import { Pressable } from "react-native";

import { Router } from "~/services/NavigationStore";
import { useGetColumn } from "~/hooks/useGetColumn";

import { cn } from "~/lib/style";
import type { Prettify } from "~/utils/types";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { StyledText } from "~/components/Typography/StyledText";
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

  export type Props = Prettify<Content & { size: number; className?: string }>;
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
  ...imgProps
}: MediaCard.Props) {
  return (
    <Pressable
      onPress={() => Router.navigate(href as Href)}
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

//#region useMediaCardListPreset
/** Presets used to render a list of `<MediaCard />`. */
export function useMediaCardListPreset(
  props: Omit<React.ComponentProps<typeof ContentPlaceholder>, "className"> & {
    data?: readonly MediaCard.Content[];
    /**
     * Renders a special entry before all other data. This assumes at `data[0]`,
     * we have a `MediaCardPlaceholderContent`.
     */
    RenderFirst?: (props: { size: number }) => React.JSX.Element;
  },
) {
  const { count, width } = useGetColumn({
    ...{ cols: 2, gap: 12, gutters: 32, minWidth: 175 },
  });
  return useMemo(
    () => ({
      numColumns: count,
      estimatedItemSize: width + 40, // ~40px for text content under `<MediaImage />`
      data: props.data,
      keyExtractor: ({ href }) => href,
      renderItem: ({ item, index }) =>
        props.RenderFirst && index === 0 ? (
          <props.RenderFirst size={width} />
        ) : (
          <MediaCard {...item} size={width} />
        ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={props.isPending}
          errMsgKey={props.errMsgKey}
        />
      ),
      columnWrapperStyle: { gap: 12 },
    }),
    [count, width, props],
  ) satisfies LegendListProps<MediaCard.Content>;
}
//#endregion
