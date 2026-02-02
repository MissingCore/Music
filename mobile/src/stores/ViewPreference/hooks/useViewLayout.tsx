import type { LegendListProps } from "@legendapp/list";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import type { GCWProps } from "~/hooks/useGetColumn";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useViewPreferenceStore } from "../store";
import type { LayoutItem, MutableViewLayout } from "../types";

import { getMediaLinkContext } from "~/navigation/utils/router";

import { cn } from "~/lib/style";
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
  gap: 12,
  gutters: 32,
  minWidth: 72,
};

/** Formats data to pass into `LegendList`. */
export function useViewLayout<TData extends Record<string, any>>(
  screen: MutableViewLayout,
  data: TData[] = [],
  formatData: (data: TData) => LayoutItem,
) {
  const navigation = useNavigation();

  const formattedData = useMemo(() => data.map(formatData), [data, formatData]);

  //#region Layout Configs
  const gridLayout = useGetColumn(gridLayoutOptions);
  const compactGridLayout = useGetColumn(compactGridLayoutOptions);
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  const listLayoutArgs = useMemo(
    () =>
      ({
        estimatedItemSize: 56, // 48px Height + 8px Margin Top
        renderItem: ({ item: { id, ...item }, index }) => (
          <SearchResult
            button
            type={screen}
            {...item}
            onPress={() =>
              navigation.navigate(...getMediaLinkContext({ id, type: screen }))
            }
            className={cn("pr-4", {
              "mt-2": index > 0,
              "rounded-full": screen === "artist",
            })}
          />
        ),
      }) satisfies Omit<LegendListProps<LayoutItem>, "data">,
    [navigation, screen],
  );

  // Handle both `grid` & `compactGrid` options.
  const gridLayoutArgs = useMemo(() => {
    const gridOpts = layoutOption === "grid" ? gridLayout : compactGridLayout;
    return {
      numColumns: gridOpts.count,
      // ~40px for text content under `<MediaImage />` + 12px Margin Bottom
      estimatedItemSize: gridOpts.width + 40 + 12,
      renderItem: ({ item }) => (
        <MediaCard
          type={screen}
          {...item}
          //? Simplest way of solving the type issue (we'll only pass an
          //? array if `screen = "playlist"`).
          source={item.imageSource as string}
          size={gridOpts.width}
          onPress={() =>
            navigation.navigate(
              ...getMediaLinkContext({ id: item.id, type: screen }),
            )
          }
          className="mx-1.5 mb-3"
        />
      ),
      className: "-mx-1.5 -mb-3",
    } satisfies Omit<LegendListProps<LayoutItem>, "data">;
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
