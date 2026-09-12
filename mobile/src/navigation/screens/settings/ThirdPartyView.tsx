// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import * as SettingsList from "./components/SettingsList";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Base/List";

export default function ThirdParty() {
  const navigation = useNavigation();
  const data = Object.entries(LicensesList);
  return (
    <FlatList
      data={data}
      keyExtractor={([id]) => id}
      renderItem={({ item: [id, item], index }) => (
        <SettingsList.Item
          contentConfig={{
            label: item.name,
            supporting: `${item.license} (${item.version})`,
          }}
          onPress={() => navigation.navigate("PackageLicense", { id })}
          className={cn("overflow-hidden bg-surfaceContainerLowest", {
            "rounded-t-3xl": index === 0,
            "rounded-b-3xl": index === data.length - 1,
          })}
        />
      )}
      contentContainerClassName="p-4 pb-safe-offset-4"
    />
  );
}
