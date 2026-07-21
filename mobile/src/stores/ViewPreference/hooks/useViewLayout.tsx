// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import {
  ColumnPresets,
  useGetColumn,
  useGridLayoutConfig,
} from "~/hooks/useGetColumn";
import { useViewPreferenceStore } from "../store";
import type { LayoutItem, MutableViewLayout } from "../types";

import { getMediaLinkContext } from "~/navigation/utils/router";

import { cn } from "~/lib/style";
import type { LegendListProps } from "~/components/Base/LegendList";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { SearchResult } from "~/modules/search/components/SearchResult";

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
  const listLayout = useGetColumn(ColumnPresets.listLayout);
  const gridLayout = useGridLayoutConfig();
  const compactGridLayout = useGetColumn(ColumnPresets.compactGridLayout);
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  const listLayoutArgs = useMemo(
    () =>
      ({
        numColumns: listLayout.count,
        estimatedItemSize: 56, // 48px Height + 8px Margin Bottom
        renderItem: ({ item: { id, ...item } }) => (
          <SearchResult
            type={screen}
            {...item}
            onPress={() =>
              navigation.navigate(...getMediaLinkContext({ id, type: screen }))
            }
            className={cn("mx-1 mb-2 pr-4", {
              "rounded-full": screen === "artist",
            })}
          />
        ),
        className: "-mx-1 -mb-2",
      }) satisfies LegendListProps<LayoutItem>,
    [navigation, screen, listLayout],
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
          className="mx-1 mb-2"
        />
      ),
      className: "-mx-1 -mb-2",
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
