// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import LicensesList from "~/resources/licenses.json";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { openLink } from "~/lib/web-browser";
import { IconButton } from "~/components/next/base/button-icon";
import { Card } from "~/components/next/base/card";
import { Text } from "~/components/next/base/typography";

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
      <ScreenOptions
        headerRight={() => (
          <IconButton
            icon="call-made"
            accessibilityLabel={t("template.entrySeeMore", {
              name: licenseInfo.name,
            })}
            onPress={() => openLink(licenseInfo.source)}
            filled
          />
        )}
      />
      <ListLayout contentContainerClassName="gap-0.75">
        <Card className="rounded-b-xs">
          <Text accent size="xl">
            {licenseInfo.name}
          </Text>
          <Text muted>{`${licenseInfo.license} (${licenseInfo.version})`}</Text>
        </Card>
        <Card className="rounded-t-xs">
          <Text size="xs">{licenseInfo.licenseText}</Text>
        </Card>
      </ListLayout>
    </>
  );
}
