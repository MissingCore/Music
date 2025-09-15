import type { StaticScreenProps } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import LicensesList from "~/resources/licenses.json";
import { useTheme } from "~/hooks/useTheme";
import { ScreenOptions } from "../../components/ScreenOptions";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { Card } from "~/components/Containment/Card";
import { IconButton } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { StyledText } from "~/components/Typography/StyledText";

type Props = StaticScreenProps<{
  id: string;
}>;

export default function PackageLicense({ route }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const licenseInfo = useMemo(
    () => LicensesList[route.params.id as keyof typeof LicensesList],
    [route.params.id],
  );

  const HeaderRight = useCallback(
    () => (
      <IconButton
        Icon={OpenInNew}
        accessibilityLabel={t("template.entrySeeMore", {
          name: licenseInfo.name,
        })}
        onPress={() => openBrowserAsync(licenseInfo.source)}
      />
    ),
    [t, licenseInfo],
  );

  return (
    <>
      <ScreenOptions headerRight={HeaderRight} />
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
