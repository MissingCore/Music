import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Search } from "@/icons";

import { TextInput } from "@/components/new/Form";
import { AccentText } from "@/components/new/Typography";

/** Screen for `/search` route. */
export default function SearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <View className="grow gap-6 p-4 pt-8">
      <AccentText className="text-3xl">{t("header.search")}</AccentText>

      <View className="flex-row items-center gap-2 rounded-full bg-surface px-4">
        <Search />
        <TextInput
          onChangeText={(text) => setQuery(text)}
          placeholder={t("form.placeholder.searchMedia")}
          className="shrink grow"
        />
      </View>
    </View>
  );
}
