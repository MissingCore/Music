import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import { useGetColumn } from "~/hooks/useGetColumn";
import { getMediaLinkContext } from "~/navigation/utils/router";

import { cn } from "~/lib/style";
import type { LegendListProps } from "~/components/Base/LegendList";
import { Pressable } from "~/components/Base/Pressable";
import { StyledText } from "~/components/Typography/StyledText";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import type { MediaCardContent, MediaCardProps } from "./MediaCard.type";
import { MediaImage } from "./MediaImage";

//#region Media Card
/**
 * Card containing information about some media and navigate to that media's
 * page on click.
 */
export function MediaCard({
  id: _,
  title,
  description,
  onPress,
  className,
  ...imgProps
}: MediaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ maxWidth: imgProps.size }}
      // Using `grow` instead of `w-full` because only 1 item gets shown otherwise.
      className={cn("grow active:opacity-75", className)}
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

//#region useMediaCardListPreset
/** Presets used to render a list of `<MediaCard />`. */
export function useMediaCardListPreset(
  args: Omit<React.ComponentProps<typeof ContentPlaceholder>, "className"> & {
    data?: readonly MediaCardContent[];
  },
) {
  const navigation = useNavigation();
  const { count, width } = useGetColumn({
    cols: 2,
    gap: 12,
    gutters: 32,
    minWidth: 144,
  });

  return useMemo(
    () => ({
      numColumns: count,
      // ~40px for text content under `<MediaImage />` + 12px Margin Bottom
      estimatedItemSize: width + 40 + 12,
      data: args.data,
      // Use this as the key instead of just `id` in case `data` is mixed.
      keyExtractor: ({ id, type }) => `${type}_${id}`,
      /*
        Utilized janky margin method to implement gaps in FlashList with columns.
          - https://github.com/shopify/flash-list/discussions/804#discussioncomment-5509022
      */
      renderItem: ({ item }) => (
        <MediaCard
          {...item}
          size={width}
          onPress={() => navigation.navigate(...getMediaLinkContext(item))}
          className="mx-1.5 mb-3"
        />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={args.isPending || args.data === undefined}
          errMsgKey={args.errMsgKey}
        />
      ),
      ListHeaderComponentStyle: { paddingHorizontal: 8 },
      className: "-mx-1.5 -mb-3",
    }),
    [args, navigation, count, width],
  ) satisfies LegendListProps<MediaCardContent>;
}
//#endregion
