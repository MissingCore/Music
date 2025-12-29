import type { StaticScreenProps } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import LicensesList from "~/resources/licenses.json";

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

  const licenseInfo = useMemo(
    () => LicensesList[id as keyof typeof LicensesList],
    [id],
  );

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={OpenInNew}
            accessibilityLabel={t("template.entrySeeMore", {
              name: licenseInfo.name,
            })}
            onPress={() => openBrowserAsync(licenseInfo.source)}
            size="sm"
          />
        )}
      />
      <SegmentedList scrollEnabled contentContainerClassName="p-4">
        <SegmentedList.CustomItem className="gap-4 p-4">
          <AccentText className="text-xl" originalText>
            {licenseInfo.name}
          </AccentText>
          <StyledText dim>
            {`${licenseInfo.version}\n\n`}
            This component is licensed under the {licenseInfo.license} license.
            {`\n\n${licenseInfo.copyright}`}
          </StyledText>
        </SegmentedList.CustomItem>
        <SegmentedList.CustomItem className="p-4">
          <StyledText className="text-xs">{licenseInfo.licenseText}</StyledText>
        </SegmentedList.CustomItem>
      </SegmentedList>
    </>
  );
}
