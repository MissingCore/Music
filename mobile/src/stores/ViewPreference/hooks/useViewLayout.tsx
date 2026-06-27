// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import type { GCWProps } from "~/hooks/useGetColumn";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useViewPreferenceStore } from "../store";
import type { LayoutItem, MutableViewLayout } from "../types";

import { getMediaLinkContext } from "~/navigation/utils/router";

import { cn } from "~/lib/style";
import type { LegendListProps } from "~/components/Base/LegendList";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { SearchResult } from "~/modules/search/components/SearchResult";

const gridLayoutOptions: GCWProps = {
  cols: 2,
  gap: 12,
  gutters: 32,
  minWidth: 144,
};
const compactGridLayoutOptions: GCWProps = {
  cols: 3,
  gap: 8,
  gutters: 32,
  minWidth: 72,
};

/** Formats data to pass into `LegendList`. */
export function useViewLayout<TData extends Record<string, any>>(
  screen: MutableViewLayout,
  data: TData[] | undefined,
  formatData: (data: TData) => LayoutItem,
) {
  const navigation = useNavigation();

  const formattedData = useMemo(
    () => data?.map(formatData),
    [data, formatData],
  );

  //#region Layout Configs
  const gridLayout = useGetColumn(gridLayoutOptions);
  const compactGridLayout = useGetColumn(compactGridLayoutOptions);
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  const listLayoutArgs = useMemo(
    () =>
      ({
        estimatedItemSize: 56, // 48px Height + 8px Margin Bottom
        renderItem: ({ item: { id, ...item } }) => (
          <SearchResult
            type={screen}
            {...item}
            onPress={() =>
              navigation.navigate(...getMediaLinkContext({ id, type: screen }))
            }
            className={cn("mb-2 pr-4", { "rounded-full": screen === "artist" })}
          />
        ),
        className: "-mb-2",
      }) satisfies LegendListProps<LayoutItem>,
    [navigation, screen],
  );

  // Handle both `grid` & `compactGrid` options.
  const gridLayoutArgs = useMemo(() => {
    const isGrid = layoutOption === "grid";
    const gridOpts = isGrid ? gridLayout : compactGridLayout;
    const usedGap = isGrid ? 12 : 8;
    return {
      numColumns: gridOpts.count,
      // ~40px for text content under `<MediaImage />` + 8/12px Margin Bottom
      estimatedItemSize: gridOpts.width + 40 + usedGap,
      renderItem: ({ item }) => (
        <MediaCard
          type={screen}
          {...item}
          source={item.imageSource}
          size={gridOpts.width}
          onPress={() =>
            navigation.navigate(
              ...getMediaLinkContext({ id: item.id, type: screen }),
            )
          }
          className={cn("mx-1.5 mb-3", { "mx-1 mb-2": !isGrid })}
        />
      ),
      className: isGrid ? "-mx-1.5 -mb-3" : "-mx-1 -mb-2",
    } satisfies LegendListProps<LayoutItem>;
  }, [navigation, layoutOption, screen, gridLayout, compactGridLayout]);
  //#endregion

  return useMemo(
    () =>
      ({
        data: formattedData,
        keyExtractor: ({ id }) => id,
        ...(layoutOption === "list" ? listLayoutArgs : gridLayoutArgs),
      }) satisfies LegendListProps<LayoutItem>,
    [layoutOption, formattedData, listLayoutArgs, gridLayoutArgs],
  );
}
