// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";
import type { TabBarProps } from "react-native-collapsible-tabs-native";
import { createTabList } from "react-native-collapsible-tabs-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import {
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";

import { cn } from "~/lib/style";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import type {
  LegendListProps,
  LegendListSignature,
  ListRenderItemInfo,
} from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { IconButton } from "~/components/next/base/button-icon";
import { TextInput } from "~/components/next/base/input";
import { Pressable } from "~/components/next/primitive/pressable";
import { Text, TText } from "~/components/next/themed/typography";
import { useTheme } from "~/modules/customization/theme/core/context";
import { useSearchStore } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

const TabLegendList = createTabList(LegendList) as LegendListSignature;

//#region Tab Bar
/** Tab bar rendered by `CollapsibleTabView`. */
export function TabBar(props: TabBarProps) {
  const { surface } = useTheme();
  const prevTabIndex = useRef(0);
  const tabListRef = useFlatListRef();

  //? Scrolls to active tab when changed.
  if (props.index !== prevTabIndex.current) {
    prevTabIndex.current = props.index;
    tabListRef.current?.scrollToIndex({
      index: props.index,
      viewPosition: 0.5,
    });
  }

  return (
    <View
      style={{ backgroundColor: surface }}
      className="flex-row items-center"
    >
      <SearchBar />
      <Animated.View layout={LinearTransition} className="shrink grow">
        <FlatList
          ref={tabListRef}
          horizontal
          data={props.routes}
          keyExtractor={({ key }) => key}
          renderItem={({ item: { title }, index }) => (
            <Pressable
              onPress={() => props.onIndexChange(index)}
              className={cn(
                "min-w-12",
                index === props.routes.length - 1 && "pr-24",
              )}
            >
              <Text
                bold
                center
                size="lg"
                color={props.index === index ? "onSurface" : "onSurfaceVariant"}
              >
                {title}
              </Text>
            </Pressable>
          )}
          contentContainerClassName="items-center gap-6 pr-4"
        />
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Search Bar
/** Allows filtering the data rendered by `DataList`. */
export function SearchBar() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { onSurface } = useTheme();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  return (
    <Animated.View
      layout={LinearTransition}
      style={{ maxWidth: Math.min(512, width) }}
      className="mx-0.75 max-w-[min(512px,100%)] flex-row items-center gap-2 overflow-hidden pr-4 pl-1"
    >
      <IconButton
        icon={searchEnabled ? "close" : "search"}
        accessibilityLabel={t(
          searchEnabled ? "form.close" : "feat.search.title",
        )}
        onPress={() => {
          setSearchEnabled((prev) => !prev);
          if (searchEnabled) setQuery("");
        }}
      />
      {searchEnabled ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={{ borderColor: onSurface, color: onSurface }}
          className="h-10 min-h-0 shrink grow border-b-2"
        />
      ) : null}
    </Animated.View>
  );
}
//#endregion

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
