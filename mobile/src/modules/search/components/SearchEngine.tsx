import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Search } from "@/icons";

import { TextInput } from "@/components/Form";
import { SearchResult } from "./SearchResult";
import { useSearch } from "../hooks/useSearch";
import type { SearchCallbacks, SearchCategories } from "../types";

/** Contained search - tracks the query and displays results. */
export function SearchEngine<TScope extends SearchCategories>(props: {
  searchScope: TScope;
  callbacks: Pick<SearchCallbacks, TScope[number]>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const results = useSearch(props.searchScope, query);

  return (
    <>
      <View className="flex-row items-center gap-2 rounded-full bg-surface px-4">
        <Search />
        <TextInput
          onChangeText={(text) => setQuery(text)}
          placeholder={t("form.placeholder.searchMedia")}
          className="shrink grow"
        />
      </View>
    </>
  );
}
