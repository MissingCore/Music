// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { Button } from "~/components/next/base/button";
import { Icon } from "~/components/next/base/icon";
import { TextStack } from "~/components/next/blocks/text-stack";

export default function ThirdParty() {
  const navigation = useNavigation();
  const data = Object.entries(LicensesList);
  return (
    <LegendList
      data={data}
      keyExtractor={([id]) => id}
      renderItem={({ item: [id, item], index }) => (
        <Button
          onPress={() => navigation.navigate("PackageLicense", { id })}
          filled
          className={cn({
            "rounded-t-xs": index > 0,
            "rounded-b-xs": index < data.length - 1,
          })}
        >
          <TextStack
            label={item.name}
            supporting={`${item.license} (${item.version})`}
          />
          <Icon name="east" size={24} className="rtl:-scale-x-100" />
        </Button>
      )}
      contentContainerClassName="gap-0.75 p-4 pb-safe-offset-4"
    />
  );
}
