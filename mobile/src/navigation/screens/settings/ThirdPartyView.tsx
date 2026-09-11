// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { FlatList } from "~/components/Base/List";
import * as SettingsList from "./components/SettingsList";

export default function ThirdParty() {
  const navigation = useNavigation();
  return (
    <ListLayout>
      <FlatList
        data={Object.entries(LicensesList)}
        keyExtractor={([id]) => id}
        renderItem={({ item: [id, item] }) => (
          <SettingsList.Item
            contentConfig={{
              label: item.name,
              supporting: `${item.license} (${item.version})`,
            }}
            onPress={() => navigation.navigate("PackageLicense", { id })}
            Trailing={<SettingsList.ActionHint />}
          />
        )}
        ItemSeparatorComponent={<SettingsList.Divider afterIconItem={false} />}
        scrollEnabled={false}
        contentContainerClassName="overflow-hidden rounded-3xl bg-surfaceContainerLowest"
      />
    </ListLayout>
  );
}
