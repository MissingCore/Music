import type { StaticScreenProps } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import LicensesList from "~/resources/licenses.json";

import { IconButton } from "~/components/Form/Button";
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
          <IconButton
            Icon={OpenInNew}
            accessibilityLabel={t("template.entrySeeMore", {
              name: licenseInfo.name,
            })}
            onPress={() => openBrowserAsync(licenseInfo.source)}
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
