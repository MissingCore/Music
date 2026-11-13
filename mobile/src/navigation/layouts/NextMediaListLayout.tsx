// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback } from "react";
import { View } from "react-native";
import { createTabList } from "react-native-collapsible-tabs-native";
import { useShallow } from "zustand/react/shallow";

import {
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";

import type {
  LegendListProps,
  LegendListSignature,
  ListRenderItemInfo,
} from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { Text, TText } from "~/components/next/themed/typography";
import { useSearchStore } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

const TabLegendList = createTabList(LegendList) as LegendListSignature;

//#region Data List
type RequiredDataFields = { id: string; name: string };

export type RenderDataListItem<TData extends RequiredDataFields> = (
  info: ListRenderItemInfo<TData> & { itemWidth: number },
) => React.ReactElement;

/** Prepared `LegendList` to render data. */
export function DataList<TData extends RequiredDataFields>({
  asTab = true,
  asGrid = false,
  label,
  data = [],
  renderItem: _renderItem,
  ...props
}: Omit<
  LegendListProps<TData>,
  "renderItem" | "ListHeaderComponent" | "ListEmptyComponent"
> & {
  CustomLegendList?: LegendListSignature;
  /** If this is used as a "tab" instead of a regular list. */
  asTab?: boolean;
  asGrid?: boolean;
  /** Renders a "label" on top of the list via `ListHeaderComponent`. */
  label?: string;
  renderItem: RenderDataListItem<TData>;
}) {
  const CustomLegendList = asTab ? TabLegendList : LegendList;
  const layout = (asGrid ? useGridLayoutConfig : useListLayoutConfig)();
  const bottomOffset = useBottomActionsOffset();
  const filteredData = useSearchStore(
    useShallow((s) =>
      // @ts-expect-error - The `name` field is guaranteed to exist.
      data ? containSorter(data, s.query, "name") : undefined,
    ),
  );

  const renderItem = useCallback(
    (info: ListRenderItemInfo<TData>) =>
      _renderItem({ ...info, itemWidth: layout.width }),
    [_renderItem, layout.width],
  );

  if (!asTab && (!filteredData || filteredData.length === 0)) return null;
  return (
    <CustomLegendList
      numColumns={layout.count}
      estimatedItemSize={(asGrid ? layout.width : 56) + 6}
      {...props}
      data={filteredData}
      keyExtractor={({ id }) => id}
      renderItem={renderItem}
      ListHeaderComponent={
        label ? (
          <Text bold size="sm">
            {label}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View className="px-4 py-12">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      className="-mx-0.75"
      contentContainerStyle={{ paddingBottom: bottomOffset, paddingTop: 16 }}
      contentContainerClassName="gap-y-1.5 p-4"
    />
  );
}
//#endregion
