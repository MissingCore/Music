// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import LicensesList from "~/resources/licenses.json";

import { openLink } from "~/lib/web-browser";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { AccentText } from "~/components/Typography/AccentText";
import { StyledText } from "~/components/Typography/StyledText";
import { ScreenOptions } from "../../components/ScreenOptions";

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
          <FilledIconButton
            icon="open-in-new"
            accessibilityLabel={t("template.entrySeeMore", {
              name: licenseInfo.name,
            })}
            onPress={() => openLink(licenseInfo.source)}
          />
        )}
      />
      <SegmentedList scrollEnabled contentContainerClassName="p-4">
        <SegmentedList.CustomItem className="gap-2 p-4">
          <AccentText className="text-xl" originalText>
            {licenseInfo.name}
          </AccentText>
          <StyledText dim>
            {`${licenseInfo.license} (${licenseInfo.version})`}
          </StyledText>
        </SegmentedList.CustomItem>
        <SegmentedList.CustomItem className="p-4">
          <StyledText className="text-xs">{licenseInfo.licenseText}</StyledText>
        </SegmentedList.CustomItem>
      </SegmentedList>
    </>
  );
}
