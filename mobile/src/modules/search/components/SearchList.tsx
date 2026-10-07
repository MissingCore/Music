// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { createContext, use, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import type {
  LegendListProps,
  ListRenderItemInfo,
} from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { TextInput, useInputRef } from "~/components/Form/Input";
import { TopDownGradient } from "~/components/Gradient";
import { IconButton } from "~/components/next/base/button-icon";
import { Icon } from "~/components/next/base/icon";
import type { ColorRole } from "~/modules/customization/theme/core/constants";

//#region Provider
interface SearchStore {
  shadowColor: ColorRole;
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<StoreApi<SearchStore>>(null as never);

function Provider(props: {
  children: React.ReactNode;
  shadowColor?: ColorRole;
}) {
  const storeRef = useRef<StoreApi<SearchStore>>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<SearchStore>()((set) => ({
      query: "",
      setQuery: (query: string) => set({ query }),
      shadowColor: props.shadowColor ?? "surface",
    }));
  }
  return (
    <SearchContext value={storeRef.current}>{props.children}</SearchContext>
  );
}

export function useSearchStore<T>(selector: (state: SearchStore) => T) {
  const store = use(SearchContext);
  return useStore(store, selector);
}
//#endregion

//#region Search Input
function Input(props: { placeholder?: string; autoFocus?: boolean }) {
  const { t } = useTranslation();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const shadowColor = useSearchStore((s) => s.shadowColor);
  const inputRef = useInputRef();

  return (
    <View className="relative z-10 -mb-6">
      <View className="flex-row items-center gap-2 rounded-full bg-surfaceContainerLowest">
        <View className="absolute inset-y-0 left-0 justify-center pl-4">
          <Icon name="search" />
        </View>
        <TextInput
          ref={inputRef}
          autoFocus={props.autoFocus}
          defaultValue={query}
          onChangeText={setQuery}
          placeholder={props.placeholder ?? t("feat.search.title")}
          className="shrink grow pl-12"
          forSheet
        />
        <IconButton
          icon="close"
          accessibilityLabel={t("form.clear")}
          onPress={() => {
            inputRef.current?.clear();
            setQuery("");
          }}
          disabled={query === ""}
          className="mr-1 disabled:invisible"
        />
      </View>
      <TopDownGradient height={24} color={shadowColor} />
    </View>
  );
}
//#endregion

//#region List
interface SearchListProps<TData> extends Omit<
  LegendListProps,
  "data" | "keyExtractor" | "renderItem"
> {
  data: TData[] | undefined;
  keyExtractor: (item: TData, index: number) => string;
  renderItem: (
    info: ListRenderItemInfo<TData> & { listSize: number },
  ) => React.ReactElement;

  onFilterData: (query: string, data: TData[]) => TData[];
  emptyMsgKey?: ParseKeys;
  /** If content should be rendered only when a query is specified. */
  renderOnQuery?: boolean;

  CustomList?: typeof LegendList;
}

function List<TData>({
  data,
  keyExtractor: _keyExtractor,
  renderItem: _renderItem,
  onFilterData,
  emptyMsgKey,
  renderOnQuery = false,
  CustomList = LegendList,
  contentContainerClassName,
  ...props
}: SearchListProps<TData>) {
  const query = useSearchStore((s) => s.query);

  const stopRender = renderOnQuery && !query.trim();

  const filteredData = useMemo(() => {
    if (stopRender) return [];
    return onFilterData(query, data ?? []);
  }, [stopRender, data, onFilterData, query]);

  const dataSize = filteredData.length;

  const keyExtractor = useCallback(
    (item: TData, index: number) => `${_keyExtractor(item, index)}__${index}`,
    [_keyExtractor],
  );

  const renderItem = useCallback(
    (args: ListRenderItemInfo<TData>) =>
      _renderItem({ ...args, listSize: dataSize }),
    [_renderItem, dataSize],
  );

  return (
    <CustomList
      data={filteredData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={
        !stopRender ? <ContentPlaceholder errMsgKey={emptyMsgKey} /> : null
      }
      contentContainerClassName={cn("pt-6", contentContainerClassName)}
      {...props}
    />
  );
}
//#endregion

//#region Exports
export const Search = { Provider, Input, List };
//#endregion
