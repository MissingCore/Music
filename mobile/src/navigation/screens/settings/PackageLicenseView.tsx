// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import LicensesList from "~/resources/licenses.json";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";

import { OnRTL } from "~/lib/react";
import { openLink } from "~/lib/web-browser";
import { Card } from "~/components/next/base/card";
import { Text } from "~/components/next/base/typography";
import { Toolbar } from "~/components/next/composed/toolbar";

type Props = StaticScreenProps<{ id: string }>;

export default function PackageLicense({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const licenseInfo = LicensesList[id as keyof typeof LicensesList];
  return (
    <>
      <Toolbar>
        <Toolbar.Contents>
          <Toolbar.Back />
        </Toolbar.Contents>
        <Toolbar.FAB
          icon={`north-${OnRTL.decide("west", "east")}`}
          accessibilityLabel={t("template.entrySeeMore", {
            name: licenseInfo.name,
          })}
          onPress={() => openLink(licenseInfo.source)}
          intent="inverse"
        />
      </Toolbar>

      <ScrollLayout title={licenseInfo.name}>
        <Card className="-mb-5.25 rounded-b-xs">
          <Text muted>{`${licenseInfo.license} (${licenseInfo.version})`}</Text>
        </Card>
        <Card className="rounded-t-xs">
          <Text size="xs">{licenseInfo.licenseText}</Text>
        </Card>
      </ScrollLayout>
    </>
  );
}
