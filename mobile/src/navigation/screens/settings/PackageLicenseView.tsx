import type { StaticScreenProps } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import LicensesList from "~/resources/licenses.json";
import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { Card } from "~/components/Containment/Card";
import { IconButton } from "~/components/Form/Button";
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
  const { theme } = useTheme();

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
      <StandardScrollLayout contentContainerClassName="pt-2">
        <AccentText className="text-4xl" originalText>
          {licenseInfo.name}
        </AccentText>

        <Card
          className={theme === "dark" ? "bg-foreground/15" : "bg-foreground/5"}
        >
          <StyledText dim>
            {`${licenseInfo.version}\n\n`}
            This component is licensed under the {licenseInfo.license} license.
            {`\n\n${licenseInfo.copyright}`}
          </StyledText>
        </Card>
        <StyledText dim>{licenseInfo.licenseText}</StyledText>
      </StandardScrollLayout>
    </>
  );
}
