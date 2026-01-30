import type { FlashListProps, ListRenderItemInfo } from "@shopify/flash-list";
import type { ParseKeys } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { TopDownGradient } from "~/components/Gradient";
import { SearchBar } from "./SearchBar";

const DEFAULT_GAP = 24;

interface SearchListProps<TData> extends Omit<
  FlashListProps<TData>,
  "data" | "keyExtractor" | "renderItem"
> {
  data?: TData[];
  keyExtractor: NonNullable<FlashListProps<TData>["keyExtractor"]>;
  renderItem: (
    info: ListRenderItemInfo<TData> & { listSize: number },
  ) => React.ReactElement;
  onFilterData: (query: string, data: TData[]) => TData[];
  emptyMsgKey?: ParseKeys;
  shadowTransitionConfig?: { gap?: number; color?: ColorRole };
  /** If content should be rendered only when a query is specified. */
  renderOnQuery?: boolean;
  wrapperStyle?: StyleProp<ViewStyle>;
  wrapperClassName?: string;
}

/** Resuable list with filtering capabilities. */
export function SearchList<TData>({
  data,
  keyExtractor: _keyExtractor,
  renderItem: _renderItem,
  onFilterData,
  emptyMsgKey,
  shadowTransitionConfig,
  renderOnQuery = false,
  wrapperStyle,
  wrapperClassName,
  ...props
}: SearchListProps<TData>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const stopRender = useMemo(
    () => renderOnQuery && !query.trim(),
    [renderOnQuery, query],
  );

  const filteredData = useMemo(() => {
    if (stopRender) return [];
    return onFilterData(query, data ?? []);
  }, [stopRender, data, onFilterData, query]);

  const dataSize = useMemo(() => filteredData.length, [filteredData]);

  const keyExtractor: SearchListProps<TData>["keyExtractor"] = useCallback(
    (item, index) => `${_keyExtractor(item, index)}__${index}`,
    [_keyExtractor],
  );

  const renderItem: NonNullable<FlashListProps<TData>["renderItem"]> =
    useCallback(
      (args) => _renderItem({ ...args, listSize: dataSize }),
      [_renderItem, dataSize],
    );

  return (
    <View style={wrapperStyle} className={cn("shrink grow", wrapperClassName)}>
      <SearchBar
        searchPlaceholder={t("feat.search.title")}
        setQuery={setQuery}
        isEmpty={query === ""}
      />
      <View className="relative shrink grow">
        <FlashList
          data={filteredData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          maintainVisibleContentPosition={{ disabled: true }}
          ListEmptyComponent={
            !stopRender ? <ContentPlaceholder errMsgKey={emptyMsgKey} /> : null
          }
          {...props}
          contentContainerStyle={[
            props.contentContainerStyle,
            { paddingTop: shadowTransitionConfig?.gap ?? DEFAULT_GAP },
          ]}
        />

        <TopDownGradient
          height={shadowTransitionConfig?.gap ?? DEFAULT_GAP}
          color={shadowTransitionConfig?.color}
          className="absolute top-0 left-0"
        />
      </View>
    </View>
  );
}
