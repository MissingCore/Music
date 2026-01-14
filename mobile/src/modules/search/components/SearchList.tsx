import type { FlashListProps } from "@shopify/flash-list";
import type { ParseKeys } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { SearchBar } from "./SearchBar";

interface SearchListProps<TData> extends FlashListProps<TData> {
  keyExtractor: NonNullable<FlashListProps<TData>["keyExtractor"]>;
  onFilterData: (query: string, data: readonly TData[]) => TData[];
  emptyMsgKey?: ParseKeys;
  wrapperStyle?: StyleProp<ViewStyle>;
  wrapperClassName?: string;
}

/** Resuable list with filtering capabilities. */
export function SearchList<TData>({
  data,
  keyExtractor,
  onFilterData,
  emptyMsgKey,
  wrapperStyle,
  wrapperClassName,
  ...props
}: SearchListProps<TData>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const revisedKeyExtractor: NonNullable<
    FlashListProps<TData>["keyExtractor"]
  > = useCallback(
    (item, index) => `${keyExtractor(item, index)}__${index}`,
    [keyExtractor],
  );

  const filteredData = useMemo(
    () => onFilterData(query, data ?? []),
    [data, onFilterData, query],
  );

  return (
    <View style={wrapperStyle} className={cn("shrink grow", wrapperClassName)}>
      <SearchBar
        searchPlaceholder={t("feat.search.title")}
        query={query}
        setQuery={setQuery}
      />
      <FlashList
        data={filteredData}
        keyExtractor={revisedKeyExtractor}
        maintainVisibleContentPosition={{ disabled: true }}
        ListEmptyComponent={<ContentPlaceholder errMsgKey={emptyMsgKey} />}
        {...props}
      />
    </View>
  );
}
