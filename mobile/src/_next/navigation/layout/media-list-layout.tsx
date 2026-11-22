// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useSearchStore } from "~/_next/context/search-context";

import { OnRTL } from "~/_next/utils/i18n";
import { cn } from "~/_next/utils/style";
import { IconButton } from "~/_next/components/button-icon";
import { BlurContainer } from "~/_next/components/blur-container";
import { TextInput } from "~/_next/components/input";

//#region App Bar
/**
 * Top app bar built for adaptive layouts listing out lots of data.
 *
 * Optionally supports search via nearest `<SearchProvider />`.
 */
export function AppBar({ searchEnabled = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View className="absolute inset-x-0 z-100 pt-safe">
      <View className="h-14 w-full flex-row items-center gap-4 px-2">
        <BlurContainer>
          <IconButton
            icon={OnRTL.decide("arrow-right", "arrow-left")}
            accessibilityLabel={t("form.back")}
            onPress={() => navigation.goBack()}
            color="text"
          />
        </BlurContainer>
        {searchEnabled ? <SearchBar /> : null}
      </View>
    </View>
  );
}

function SearchBar() {
  const { t } = useTranslation();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const setQuery = useSearchStore((s) => s.setQuery);

  return (
    <View className="relative min-w-10.5 flex-1 items-end">
      <BlurContainer
        className={cn(
          "h-10.5 max-w-[min(512px,100%)] min-w-10.5",
          searchEnabled && "w-full pr-10 pl-2",
        )}
      >
        {searchEnabled ? (
          <TextInput
            autoFocus
            placeholder={t("feat.search.extra.searchMedia")}
            //? Doesn't need to be controlled as it's only changed here.
            onChangeText={setQuery}
            className="size-full"
            style={{ textAlignVertical: "center" }}
          />
        ) : null}
      </BlurContainer>
      <IconButton
        icon={searchEnabled ? "close" : "search"}
        accessibilityLabel={t(
          searchEnabled ? "form.close" : "feat.search.title",
        )}
        onPress={() => {
          setSearchEnabled((prev) => !prev);
          if (searchEnabled) setQuery("");
        }}
        color="text"
        //? Absolute-positioned as layout animation would have it slide-in
        //? with the text input.
        className="absolute top-px right-px"
      />
    </View>
  );
}
//#endregion
