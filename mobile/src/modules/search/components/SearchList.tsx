import type { FlashListProps } from "@shopify/flash-list";
import type { ParseKeys } from "i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { useColor } from "~/hooks/useTheme";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { SearchBar } from "./SearchBar";

const DEFAULT_GAP = 24;

interface SearchListProps<TData> extends FlashListProps<TData> {
  keyExtractor: NonNullable<FlashListProps<TData>["keyExtractor"]>;
  onFilterData: (query: string, data: readonly TData[]) => TData[];
  emptyMsgKey?: ParseKeys;
  shadowTransitionConfig?: { gap?: number; color?: ColorRole };
  wrapperStyle?: StyleProp<ViewStyle>;
  wrapperClassName?: string;
}

/** Resuable list with filtering capabilities. */
export function SearchList<TData>({
  data,
  keyExtractor,
  onFilterData,
  emptyMsgKey,
  shadowTransitionConfig,
  wrapperStyle,
  wrapperClassName,
  ...props
}: SearchListProps<TData>) {
  const { t } = useTranslation();
  const shadowColor = useColor(shadowTransitionConfig?.color, "surface");
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
      <View className="relative shrink grow">
        <FlashList
          data={filteredData}
          keyExtractor={revisedKeyExtractor}
          maintainVisibleContentPosition={{ disabled: true }}
          ListEmptyComponent={<ContentPlaceholder errMsgKey={emptyMsgKey} />}
          {...props}
          contentContainerStyle={[
            props.contentContainerStyle,
            { paddingTop: shadowTransitionConfig?.gap ?? DEFAULT_GAP },
          ]}
        />
        <LinearGradient
          colors={[`${shadowColor}E6`, `${shadowColor}00`]}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 0.0, y: 1.0 }}
          style={{ height: shadowTransitionConfig?.gap ?? DEFAULT_GAP }}
          className="absolute top-0 left-0 w-full"
        />
      </View>
    </View>
  );
}
