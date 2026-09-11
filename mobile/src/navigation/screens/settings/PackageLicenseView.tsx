// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { View } from "react-native";

import LicensesList from "~/resources/licenses.json";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { openLink } from "~/lib/web-browser";
import { Ripple } from "~/components/next/base/ripple";
import { Text } from "~/components/next/base/typography";
import { createTextStack } from "~/components/next/blocks/text-stack";
import * as SettingsList from "./components/SettingsList";

const HeaderTextStack = createTextStack({
  labelConfig: { intent: "accent", size: "2xl" },
  supportingConfig: { muted: true },
});

type Props = StaticScreenProps<{ id: string }>;

export default function PackageLicense({
  route: {
    params: { id },
  },
}: Props) {
  const licenseInfo = LicensesList[id as keyof typeof LicensesList];
  return (
    <ListLayout>
      <SettingsList.Container hasIcon={false} className="gap-4">
        <View className="flex-row items-end gap-4 p-4 pb-2">
          <HeaderTextStack
            label={licenseInfo.name}
            supporting={`${licenseInfo.license} (${licenseInfo.version})`}
          />
          <Ripple
            onPress={() => openLink(licenseInfo.source)}
            className="rounded-full"
          >
            <SettingsList.ActionHint hint="external" />
          </Ripple>
        </View>
        <SettingsList.Divider />
        <Text className="p-4 pt-2 text-xs">{licenseInfo.licenseText}</Text>
      </SettingsList.Container>
    </ListLayout>
  );
}
