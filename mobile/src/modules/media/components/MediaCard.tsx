// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { View } from "react-native";

import { useGridLayoutConfig } from "~/hooks/useLayoutConfigs";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import type { LegendListProps } from "~/components/Base/LegendList";
import { Ripple } from "~/components/Base/Pressable";
import { StyledText } from "~/components/Typography/StyledText";
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
    <Ripple
      onPress={onPress}
      style={[
        { maxWidth: imgProps.size },
        //? Conditionally applying `rounded-t-full` will break the border
        //? radius applied to the bottom.
        //?   - https://github.com/tailwindlabs/tailwindcss/issues/16902#issuecomment-2692698264
        imgProps.type === "artist" && {
          borderTopStartRadius: imgProps.size / 2,
          borderEndStartRadius: imgProps.size / 2,
        },
      ]}
      // Using `grow` instead of `w-full` because only 1 item gets shown otherwise.
      className={cn("grow rounded-t-lg rounded-b-md", className)}
    >
      <MediaImage {...imgProps} />
      <View className="px-1.5 py-1">
        <StyledText numberOfLines={1} className="text-sm">
          {title}
        </StyledText>
        <StyledText dim numberOfLines={1}>
          {description}
        </StyledText>
      </View>
    </Ripple>
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
  const { count, width } = useGridLayoutConfig();

  return useMemo(
    () => ({
      numColumns: count,
      // ~44px for text content under `<MediaImage />` + 8px Margin Bottom
      estimatedItemSize: width + 44 + 8,
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
          className="mx-1 mb-2"
        />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={args.isPending || args.data === undefined}
          errMsgKey={args.errMsgKey}
        />
      ),
      ListHeaderComponentStyle: { paddingHorizontal: 8 },
      className: "-mx-1 -mb-2",
    }),
    [args, navigation, count, width],
  ) satisfies LegendListProps<MediaCardContent>;
}
//#endregion
