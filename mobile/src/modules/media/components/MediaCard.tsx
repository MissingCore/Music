import type { FlashListProps } from "@shopify/flash-list";
import { useMemo } from "react";
import { I18nManager, Pressable } from "react-native";

import { useGetColumn } from "~/hooks/useGetColumn";
import { router } from "~/navigation/utils/router";

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
      onPress={() => router.navigate(href)}
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
    RenderFirst?: (props: {
      size: number;
      className: string;
    }) => React.JSX.Element;
  },
) {
  const { count, width } = useGetColumn({
    cols: 2,
    gap: 12,
    gutters: 32,
    minWidth: 175,
  });
  return useMemo(
    () => ({
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
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={props.isPending}
          errMsgKey={props.errMsgKey}
        />
      ),
      ListHeaderComponentStyle: { paddingHorizontal: 8 },
      className: "-mx-1.5 -mb-3",
      /** If in RTL, layout breaks with columns. */
      disableAutoLayout: I18nManager.isRTL,
    }),
    [count, width, props],
  ) satisfies FlashListProps<MediaCard.Content>;
}
//#endregion
