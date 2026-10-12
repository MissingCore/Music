// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { ScrollLayoutTitle } from "~/navigation/layouts/ScrollLayout";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { Button } from "~/components/next/base/button";
import { Icon } from "~/components/next/base/icon";
import { TextStack } from "~/components/next/blocks/text-stack";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";

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
          className={cn({
            "rounded-t-xs": index > 0,
            "rounded-b-xs": index < data.length - 1,
          })}
        >
          <TextStack
            label={item.name}
            supporting={`${item.license} (${item.version})`}
          />
          <Icon name={OnRTL.decide("west", "east")} />
        </Button>
      )}
      ListHeaderComponent={
        <ScrollLayoutTitle title="feat.thirdParty.title" className="mb-5.25" />
      }
      contentContainerClassName={cn("gap-0.75 p-4", ToolbarScreenOffset)}
    />
  );
}
